import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {randomUUID} from 'node:crypto';
import {sessionCookieName,verifySession} from '../../../../../lib/ycm-access-control';
import {buildAuditRecord} from '../../../../../lib/ycm-audit-events';
import {getPostgresYcmAuditStore} from '../../../../../lib/ycm-postgres-audit-store';
export const runtime='nodejs';
type ExpenseBody={category?:string;description?:string;amountPaise?:number;expenseDate?:string;subcategory?:string;vendorName?:string;taxPaise?:number;paymentMethod?:string;reference?:string;employeeUserId?:string;assetId?:string;metadata?:Record<string,unknown>};
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const roles=new Set(['ceo','management','admin']);
const cats=new Set(['employee','office','marketing','operations','technology','travel','legal_compliance','asset_purchase','bank_payment','other']);
export async function POST(r:NextRequest){
 const s=verifySession(r.cookies.get(sessionCookieName())?.value);if(!s||!roles.has(s.role))return NextResponse.json({success:false,code:s?'FORBIDDEN':'AUTHENTICATION_REQUIRED'},{status:s?403:401});
 const b=await r.json().catch(()=>null) as ExpenseBody;
 const amountPaise=b?.amountPaise;
 const taxPaise=typeof b?.taxPaise==='number'&&Number.isSafeInteger(b.taxPaise)&&b.taxPaise>=0?b.taxPaise:0;
 if(!b||typeof b.category!=='string'||!cats.has(b.category)||typeof b.description!=='string'||typeof amountPaise!=='number'||!Number.isSafeInteger(amountPaise)||amountPaise<=0)return NextResponse.json({success:false,code:'EXPENSE_FIELDS_INVALID'},{status:400});
 if(b.description.length>1000||(b.vendorName?.length??0)>180||(b.reference?.length??0)>180)return NextResponse.json({success:false,code:'EXPENSE_TEXT_INVALID'},{status:400});
 const sql=db();if(!sql)return NextResponse.json({success:false,code:'DATABASE_NOT_CONFIGURED'},{status:503});
 try{const id=randomUUID();await sql`INSERT INTO ycm_company_expenses(expense_id,expense_date,category,subcategory,vendor_name,description,amount_paise,tax_paise,payment_method,reference,employee_user_id,asset_id,status,metadata) VALUES(${id},COALESCE(${b.expenseDate??null},CURRENT_DATE),${b.category},${b.subcategory??null},${b.vendorName??null},${b.description.trim()},${amountPaise},${taxPaise},${b.paymentMethod??null},${b.reference??null},${b.employeeUserId??null},${b.assetId??null},'draft',${JSON.stringify(b.metadata??{})}::jsonb)`;
 const audit=getPostgresYcmAuditStore();if(audit)await audit.append(buildAuditRecord({event:'COMPANY_EXPENSE_CREATED',subject:s.sub,role:s.role,sessionId:s.sessionId,resourceType:'company_expense',resourceId:id,success:true})).catch(()=>{});
 return NextResponse.json({success:true,expenseId:id,status:'draft'},{status:201});}catch{return NextResponse.json({success:false,code:'EXPENSE_CREATE_FAILED'},{status:400});}finally{await sql.end({timeout:3});}}
