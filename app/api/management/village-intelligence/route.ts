import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';
import { sessionCookieName, verifySession } from '../../../lib/ycm-access-control';

export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:5,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const auth=(r:NextRequest)=>{const s=verifySession(r.cookies.get(sessionCookieName())?.value);return s&&['ceo','admin','management'].includes(s.role)?s:null};

function scoreProfile(p:any){const banking=(p.bank_branch_count??0)+(p.atm_count??0)+(p.banking_correspondent_count??0);const bankingGap=banking===0?100:banking===1?75:banking<4?40:10;const insurance=p.insured_population_pct==null?60:p.insured_population_pct<25?100:p.insured_population_pct<50?70:p.insured_population_pct<75?35:10;const students=p.student_count??0;const schools=p.government_school_count??0;const schoolGap=students>=100&&schools===0?100:students>=50&&schools===0?85:p.nearest_government_school_km!=null&&p.nearest_government_school_km>5?75:schools===0?50:10;const score=Math.round(bankingGap*.35+insurance*.30+schoolGap*.35);return{score,priority:score>=75?'high':score>=50?'medium':'low',signals:{bankingGap,insuranceGap:insurance,schoolGap}}}

export async function GET(r:NextRequest){if(!auth(r))return NextResponse.json({success:false,code:'FORBIDDEN_ROLE_SCOPE'},{status:403});return NextResponse.json({success:true,service:'village-opportunity-intelligence',weights:{banking:35,insurance:30,school:35}})}
export async function POST(r:NextRequest){if(!auth(r))return NextResponse.json({success:false,code:'FORBIDDEN_ROLE_SCOPE'},{status:403});const b=await r.json().catch(()=>null);if(!b)return NextResponse.json({success:false,code:'INVALID_JSON'},{status:400});return NextResponse.json({success:true,profile:b,intelligence:scoreProfile(b)},{status:201})}
