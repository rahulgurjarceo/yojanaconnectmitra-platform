import {timingSafeEqual} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {releaseEligibleSettlements} from '../../../lib/ycm-settlement';
export const runtime='nodejs';
export async function POST(r:NextRequest){
 const configured=process.env.YCM_SETTLEMENT_RELEASE_SECRET;
 const supplied=r.headers.get('x-ycm-settlement-secret');
 const configuredBytes=Buffer.from(configured||'','utf8');const suppliedBytes=Buffer.from(supplied||'','utf8');
 if(!configured||!supplied||configuredBytes.length===0||suppliedBytes.length!==configuredBytes.length||!timingSafeEqual(suppliedBytes,configuredBytes))return NextResponse.json({success:false,code:'SETTLEMENT_RELEASE_UNAUTHORIZED'},{status:401});
 try{return NextResponse.json({success:true,policy:'T+1',...(await releaseEligibleSettlements())});}
 catch{return NextResponse.json({success:false,code:'SETTLEMENT_RELEASE_FAILED'},{status:500});}
}
