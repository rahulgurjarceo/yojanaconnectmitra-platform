import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
export async function GET(r:NextRequest){
 const code=new URL(r.url).searchParams.get('serviceCode')?.trim().toUpperCase();
 if(!code)return NextResponse.json({success:false,code:'SERVICE_CODE_REQUIRED'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{
  const rows=await sql`SELECT field_id,service_code,field_key,field_label,voice_prompt_hi,voice_prompt_en,field_type,required,sequence_no,options,metadata FROM ycm_service_form_fields WHERE service_code=${code} ORDER BY sequence_no,field_label`;
  return NextResponse.json({success:true,serviceCode:code,fields:rows,voice:{enabled:true,mode:'guided-field-by-field',languages:['hi-IN','en-IN']}},{headers:{'Cache-Control':'private,no-store'}});
 }finally{await sql.end({timeout:3})}
}
