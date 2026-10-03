import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {randomUUID} from 'node:crypto';
import {sessionCookieName,verifySession} from '../../../../../lib/ycm-access-control';
import {buildAuditRecord} from '../../../../../lib/ycm-audit-events';
import {getPostgresYcmAuditStore} from '../../../../../lib/ycm-postgres-audit-store';
export const runtime='nodejs';
type AssetBody={assetCategory?:string;assetName?:string;purchaseAmountPaise?:number;quantity?:number;description?:string;vendorName?:string;invoiceReference?:string;assetCode?:string;purchaseDate?:string;currentValuePaise?:number;assignedEmployeeUserId?:string;location?:string;metadata?:Record<string,unknown>};
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const roles=new Set(['ceo','management','admin']);
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!roles.has(s.role))return NextResponse.json({success:false,code:s?'FORBIDDEN':'AUTHENTICATION_REQUIRED'},{status:s?403:401});
 const b=await r.json().catch(()=>null) as AssetBody;
 if(!b||typeof b.assetCategory!=='string'||typeof b.assetName!=='string'||!Number.isSafeInteger(b.purchaseAmountPaise)||b.purchaseAmountPaise<0||!Number.isSafeInteger(b.quantity)||b.quantity<1)return NextResponse.json({success:false,code:'ASSET_FIELDS_INVALID'},{status:400});
 if(b.assetCategory.length>48||b.assetName.length>180||b.description?.length>1000||b.vendorName?.length>180||b.invoiceReference?.length>180)return NextResponse.json({success:false,code:'ASSET_TEXT_INVALID'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const id=randomUUID();const code=typeof b.assetCode==='string'&&b.assetCode.length<=80?b.assetCode.trim():`YCM-ASSET-${Date.now()}-${id.slice(0,8)}`;
 await sql`INSERT INTO ycm_company_assets(asset_id,purchase_date,asset_code,asset_category,asset_name,description,vendor_name,invoice_reference,quantity,purchase_amount_paise,current_value_paise,assigned_employee_user_id,location,status,metadata) VALUES(${id},COALESCE(${b.purchaseDate??null},CURRENT_DATE),${code},${b.assetCategory.trim()},${b.assetName.trim()},${b.description??null},${b.vendorName??null},${b.invoiceReference??null},${b.quantity},${b.purchaseAmountPaise},${Number.isSafeInteger(b.currentValuePaise)&&b.currentValuePaise>=0?b.currentValuePaise:b.purchaseAmountPaise},${b.assignedEmployeeUserId??null},${b.location??null},'active',${b.metadata??{}}::jsonb)`;
 const audit=getPostgresYcmAuditStore();if(audit)await audit.append(buildAuditRecord({event:'COMPANY_ASSET_CREATED',subject:s.sub,role:s.role,sessionId:s.sessionId,resourceType:'company_asset',resourceId:id,success:true})).catch(()=>{});
 return NextResponse.json({success:true,assetId:id,assetCode:code,status:'active'},{status:201});}catch{return NextResponse.json({success:false,code:'ASSET_CREATE_FAILED'},{status:400});}finally{await sql.end({timeout:3});}}
