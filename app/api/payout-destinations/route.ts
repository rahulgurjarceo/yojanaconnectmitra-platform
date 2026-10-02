import postgres from 'postgres';
import {randomUUID} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {sessionCookieName,verifySession} from '../../../lib/ycm-access-control';

export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:6,prepare:false,connect_timeout:10,idle_timeout:20}):null};

export async function GET(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const rows=await sql\`SELECT d.destination_id,d.method,d.label,d.account_holder_name,d.bank_account_last4,d.bank_ifsc,d.upi_id,d.provider,d.status,d.is_default,d.created_at,d.updated_at
    FROM ycm_payout_destinations d JOIN ycm_users u ON u.id=d.user_id
    WHERE u.user_id=\${s.sub} ORDER BY d.is_default DESC,d.created_at DESC\`;
  return NextResponse.json({success:true,destinations:rows});
 }finally{await sql.end({timeout:3});}
}

export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const b=await r.json().catch(()=>null) as {method?:'bank'|'upi'|'manual';label?:string;accountHolderName?:string;bankAccountLast4?:string;bankIfsc?:string;upiId?:string;provider?:string;providerBeneficiaryId?:string;isDefault?:boolean}|null;
 if(!b?.method||!b.label)return NextResponse.json({success:false,code:'PAYOUT_DESTINATION_FIELDS_REQUIRED'},{status:400});
 if(b.method==='bank'&&(!b.bankAccountLast4||!b.bankIfsc))return NextResponse.json({success:false,code:'BANK_DESTINATION_FIELDS_REQUIRED'},{status:400});
 if(b.method==='upi'&&!b.upiId)return NextResponse.json({success:false,code:'UPI_DESTINATION_FIELDS_REQUIRED'},{status:400});
 if(b.bankAccountLast4&&!/^\\d{4}$/.test(b.bankAccountLast4))return NextResponse.json({success:false,code:'BANK_LAST4_INVALID'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{return await sql.begin(async tx=>{
  const user=(await tx\`SELECT id FROM ycm_users WHERE user_id=\${s.sub} LIMIT 1\`)[0];if(!user)throw new Error('USER_NOT_FOUND');
  if(b.isDefault)await tx\`UPDATE ycm_payout_destinations SET is_default=false,updated_at=NOW() WHERE user_id=\${user.id}\`;
  const id=randomUUID();
  const row=(await tx\`INSERT INTO ycm_payout_destinations(destination_id,user_id,method,label,account_holder_name,bank_account_last4,bank_ifsc,upi_id,provider,provider_beneficiary_id,is_default)
    VALUES(\${id},\${user.id},\${b.method},\${b.label},\${b.accountHolderName??null},\${b.bankAccountLast4??null},\${b.bankIfsc?.toUpperCase()??null},\${b.upiId??null},\${b.provider??null},\${b.providerBeneficiaryId??null},\${b.isDefault??false})
    RETURNING destination_id,method,label,account_holder_name,bank_account_last4,bank_ifsc,upi_id,provider,status,is_default\`)[0];
  return NextResponse.json({success:true,destination:row},{status:201});
 });}catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'PAYOUT_DESTINATION_CREATE_FAILED'},{status:400});}finally{await sql.end({timeout:3});}
}

export async function PATCH(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s)return NextResponse.json({success:false,code:'AUTHENTICATION_REQUIRED'},{status:401});
 const b=await r.json().catch(()=>null) as {destinationId?:string;status?:'active'|'disabled'|'pending_verification';isDefault?:boolean}|null;
 if(!b?.destinationId)return NextResponse.json({success:false,code:'DESTINATION_ID_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const user=(await sql\`SELECT id FROM ycm_users WHERE user_id=\${s.sub} LIMIT 1\`)[0];if(!user)return NextResponse.json({success:false,code:'USER_NOT_FOUND'},{status:404});
  if(b.isDefault)await sql\`UPDATE ycm_payout_destinations SET is_default=false,updated_at=NOW() WHERE user_id=\${user.id}\`;
  const rows=await sql\`UPDATE ycm_payout_destinations SET status=COALESCE(\${b.status??null},status),is_default=COALESCE(\${b.isDefault??null},is_default),updated_at=NOW() WHERE destination_id=\${b.destinationId} AND user_id=\${user.id} RETURNING destination_id,method,label,status,is_default\`;
  if(!rows[0])return NextResponse.json({success:false,code:'PAYOUT_DESTINATION_NOT_FOUND'},{status:404});
  return NextResponse.json({success:true,destination:rows[0]});
 }finally{await sql.end({timeout:3});}
}
