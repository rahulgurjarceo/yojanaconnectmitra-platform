import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {randomUUID} from 'node:crypto';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const readers=new Set(['ceo','admin','management','employee']),writers=new Set(['ceo','admin','management']);
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const validText=(v:unknown,n:number)=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=n;
export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});if(!readers.has(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const [locations,items,stock,transfers]=await Promise.all([
   sql`SELECT location_id,location_code,location_name,location_type,address,status FROM ycm_supply_locations ORDER BY location_name`,
   sql`SELECT item_id,sku,item_name,category,unit,reorder_level,status FROM ycm_supply_items ORDER BY item_name`,
   sql`SELECT s.location_id,l.location_code,l.location_name,s.item_id,i.sku,i.item_name,i.unit,i.reorder_level,s.quantity,s.average_unit_cost_paise,(s.quantity*s.average_unit_cost_paise)::bigint stock_value_paise,(s.quantity<=i.reorder_level) low_stock FROM ycm_supply_stock s JOIN ycm_supply_locations l USING(location_id) JOIN ycm_supply_items i USING(item_id) ORDER BY l.location_name,i.item_name`,
   sql`SELECT t.transfer_id,t.transfer_reference,t.status,t.notes,t.created_at,t.received_at,src.location_name source_location,dst.location_name destination_location,COALESCE(json_agg(json_build_object('itemId',i.item_id,'sku',i.sku,'itemName',i.item_name,'quantity',ln.quantity,'unitCostPaise',ln.unit_cost_paise)) FILTER(WHERE i.item_id IS NOT NULL),'[]'::json) lines FROM ycm_supply_transfers t JOIN ycm_supply_locations src ON src.location_id=t.source_location_id JOIN ycm_supply_locations dst ON dst.location_id=t.destination_location_id LEFT JOIN ycm_supply_transfer_lines ln USING(transfer_id) LEFT JOIN ycm_supply_items i USING(item_id) GROUP BY t.transfer_id,src.location_name,dst.location_name ORDER BY t.created_at DESC LIMIT 300`
  ]);
  return NextResponse.json({success:true,locations,items,stock,transfers,summary:{locations:locations.length,items:items.length,stockValuePaise:stock.reduce((a,x)=>a+Number(x.stock_value_paise||0),0),lowStock:stock.filter(x=>x.low_stock).length,inTransit:transfers.filter(x=>x.status==='in_transit').length}},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'SUPPLY_READ_FAILED'},{status:500});}finally{await sql.end({timeout:3});}
}
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});if(!writers.has(s.role))return NextResponse.json({success:false,code:'FORBIDDEN'},{status:403});
 const b=await r.json().catch(()=>null) as Record<string,unknown>|null;if(!b||typeof b.action!=='string')return NextResponse.json({success:false,code:'SUPPLY_ACTION_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  if(b.action==='add_location'){
   if(!validText(b.locationCode,80)||!validText(b.locationName,180)||!['warehouse','store','centre','franchise','office'].includes(String(b.locationType||'store')))return NextResponse.json({success:false,code:'LOCATION_FIELDS_INVALID'},{status:400});
   const rows=await sql`INSERT INTO ycm_supply_locations(location_code,location_name,location_type,address) VALUES(${String(b.locationCode).trim()},${String(b.locationName).trim()},${String(b.locationType||'store')},${typeof b.address==='string'?b.address.slice(0,1000):null}) ON CONFLICT(location_code) DO NOTHING RETURNING location_id`;
   if(!rows.length)return NextResponse.json({success:false,code:'LOCATION_CODE_EXISTS'},{status:409});return NextResponse.json({success:true,locationId:rows[0].location_id},{status:201});
  }
  if(b.action==='add_item'){
   if(!validText(b.sku,100)||!validText(b.itemName,180)||!validText(b.category||'general',80)||!validText(b.unit||'unit',24)||!Number.isSafeInteger(b.reorderLevel??0)||Number(b.reorderLevel??0)<0)return NextResponse.json({success:false,code:'ITEM_FIELDS_INVALID'},{status:400});
   const rows=await sql`INSERT INTO ycm_supply_items(sku,item_name,category,unit,reorder_level) VALUES(${String(b.sku).trim()},${String(b.itemName).trim()},${String(b.category||'general').trim()},${String(b.unit||'unit').trim()},${Number(b.reorderLevel??0)}) ON CONFLICT(sku) DO NOTHING RETURNING item_id`;
   if(!rows.length)return NextResponse.json({success:false,code:'SKU_EXISTS'},{status:409});return NextResponse.json({success:true,itemId:rows[0].item_id},{status:201});
  }
  if(b.action==='receive_stock'){
   if(!uuid(b.locationId)||!uuid(b.itemId)||!Number.isSafeInteger(b.quantity)||Number(b.quantity)<=0||Number(b.quantity)>1000000||!Number.isSafeInteger(b.unitCostPaise)||Number(b.unitCostPaise)<0||Number(b.unitCostPaise)>Number.MAX_SAFE_INTEGER||(b.vendorName!==undefined&&!validText(b.vendorName,180))||(b.invoiceReference!==undefined&&!validText(b.invoiceReference,180)))return NextResponse.json({success:false,code:'STOCK_RECEIPT_FIELDS_INVALID'},{status:400});
   const result=await sql.begin(async tx=>{
    const locationId=String(b.locationId),itemId=String(b.itemId);const loc=await tx`SELECT location_id FROM ycm_supply_locations WHERE location_id=${locationId} AND status='active'`,item=await tx`SELECT item_id FROM ycm_supply_items WHERE item_id=${itemId} AND status='active'`;
    if(!loc.length||!item.length)throw new Error('LOCATION_OR_ITEM_NOT_FOUND');
    await tx`INSERT INTO ycm_supply_stock(location_id,item_id,quantity,average_unit_cost_paise) VALUES(${String(b.locationId)},${String(b.itemId)},${Number(b.quantity)},${Number(b.unitCostPaise)}) ON CONFLICT(location_id,item_id) DO UPDATE SET quantity=ycm_supply_stock.quantity+EXCLUDED.quantity,average_unit_cost_paise=FLOOR(((ycm_supply_stock.quantity*ycm_supply_stock.average_unit_cost_paise)+(EXCLUDED.quantity*EXCLUDED.average_unit_cost_paise))::numeric/(ycm_supply_stock.quantity+EXCLUDED.quantity))::bigint,updated_at=NOW()`;
    await tx`INSERT INTO ycm_supply_movements(location_id,item_id,movement_type,quantity_delta,unit_cost_paise,vendor_name,invoice_reference,external_reference,notes,created_by) VALUES(${String(b.locationId)},${String(b.itemId)},'purchase_receipt',${Number(b.quantity)},${Number(b.unitCostPaise)},${typeof b.vendorName==='string'?b.vendorName:null},${typeof b.invoiceReference==='string'?b.invoiceReference:null},${typeof b.externalReference==='string'?b.externalReference:null},${typeof b.notes==='string'?b.notes.slice(0,1000):null},${s.sub||null})`;
    return {receivedQuantity:Number(b.quantity)};
   });return NextResponse.json({success:true,...result},{status:201});
  }
  if(b.action==='transfer_stock'){
   if(!uuid(b.sourceLocationId)||!uuid(b.destinationLocationId)||b.sourceLocationId===b.destinationLocationId||!Array.isArray(b.lines)||b.lines.length<1||b.lines.length>100)return NextResponse.json({success:false,code:'TRANSFER_FIELDS_INVALID'},{status:400});
   const lines=b.lines as Array<{itemId:string;quantity:number}>;if(lines.some(x=>!uuid(x.itemId)||!Number.isSafeInteger(x.quantity)||Number(x.quantity)<=0||Number(x.quantity)>1000000)||new Set(lines.map(x=>x.itemId)).size!==lines.length)return NextResponse.json({success:false,code:'TRANSFER_LINES_INVALID'},{status:400});
   const transferId=randomUUID(),reference='YCM-ST-'+Date.now().toString(36).toUpperCase()+'-'+transferId.slice(0,8).toUpperCase();
   await sql.begin(async tx=>{
    const locs=await tx`SELECT location_id FROM ycm_supply_locations WHERE location_id IN (${tx.array([b.sourceLocationId,b.destinationLocationId])}::uuid[]) AND status='active' FOR SHARE`;if(locs.length!==2)throw new Error('LOCATION_NOT_FOUND');
    await tx`INSERT INTO ycm_supply_transfers(transfer_id,transfer_reference,source_location_id,destination_location_id,notes,created_by) VALUES(${transferId},${reference},${String(b.sourceLocationId)},${String(b.destinationLocationId)},${typeof b.notes==='string'?b.notes.slice(0,1000):null},${s.sub||null})`;
    for(const line of lines){const rows=await tx`SELECT quantity,average_unit_cost_paise FROM ycm_supply_stock WHERE location_id=${String(b.sourceLocationId)} AND item_id=${line.itemId} FOR UPDATE`;const q=Number(line.quantity);if(!rows.length||Number(rows[0].quantity)<q)throw new Error('INSUFFICIENT_STOCK');const cost=Number(rows[0].average_unit_cost_paise);
     await tx`UPDATE ycm_supply_stock SET quantity=quantity-${q},updated_at=NOW() WHERE location_id=${String(b.sourceLocationId)} AND item_id=${line.itemId}`;
     await tx`INSERT INTO ycm_supply_transfer_lines(transfer_id,item_id,quantity,unit_cost_paise) VALUES(${transferId},${line.itemId},${q},${cost})`;
     await tx`INSERT INTO ycm_supply_movements(location_id,item_id,movement_type,quantity_delta,unit_cost_paise,transfer_id,created_by) VALUES(${String(b.sourceLocationId)},${line.itemId},'transfer_out',${-q},${cost},${transferId},${s.sub||null})`;
    }
   });return NextResponse.json({success:true,transferId,transferReference:reference,status:'in_transit'},{status:201});
  }
  if(b.action==='confirm_transfer'){
   if(!uuid(b.transferId))return NextResponse.json({success:false,code:'TRANSFER_ID_INVALID'},{status:400});
   const result=await sql.begin(async tx=>{
    const rows=await tx`SELECT * FROM ycm_supply_transfers WHERE transfer_id=${String(b.transferId)} FOR UPDATE`;const t=rows[0];if(!t)throw new Error('TRANSFER_NOT_FOUND');if(t.status!=='in_transit')throw new Error('TRANSFER_NOT_IN_TRANSIT');
    const lines=await tx`SELECT item_id,quantity,unit_cost_paise FROM ycm_supply_transfer_lines WHERE transfer_id=${String(b.transferId)}`;
    for(const line of lines){await tx`INSERT INTO ycm_supply_stock(location_id,item_id,quantity,average_unit_cost_paise) VALUES(${t.destination_location_id},${line.item_id},${line.quantity},${line.unit_cost_paise}) ON CONFLICT(location_id,item_id) DO UPDATE SET quantity=ycm_supply_stock.quantity+EXCLUDED.quantity,average_unit_cost_paise=FLOOR(((ycm_supply_stock.quantity*ycm_supply_stock.average_unit_cost_paise)+(EXCLUDED.quantity*EXCLUDED.average_unit_cost_paise))::numeric/(ycm_supply_stock.quantity+EXCLUDED.quantity))::bigint,updated_at=NOW()`;
     await tx`INSERT INTO ycm_supply_movements(location_id,item_id,movement_type,quantity_delta,unit_cost_paise,transfer_id,created_by) VALUES(${t.destination_location_id},${line.item_id},'transfer_in',${line.quantity},${line.unit_cost_paise},${String(b.transferId)},${s.sub||null})`;}
    await tx`UPDATE ycm_supply_transfers SET status='received',received_by=${s.sub||null},received_at=NOW() WHERE transfer_id=${String(b.transferId)}`;return {receivedLines:lines.length};
   });return NextResponse.json({success:true,...result,status:'received'});
  }
  return NextResponse.json({success:false,code:'SUPPLY_ACTION_INVALID'},{status:400});
 }catch(e){const code=e instanceof Error?e.message:'SUPPLY_OPERATION_FAILED';const status=code==='INSUFFICIENT_STOCK'||code==='TRANSFER_NOT_IN_TRANSIT'?409:code==='TRANSFER_NOT_FOUND'||code==='LOCATION_OR_ITEM_NOT_FOUND'||code==='LOCATION_NOT_FOUND'?404:500;return NextResponse.json({success:false,code},{status});}finally{await sql.end({timeout:3});}
}
