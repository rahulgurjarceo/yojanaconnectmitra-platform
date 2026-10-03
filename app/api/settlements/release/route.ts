import {timingSafeEqual} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {releaseEligibleSettlements} from '../../../lib/ycm-settlement';
export const runtime='nodejs';
export async function POST(r:NextRequest){
 const configured=process.env.YCM_SETTLEMENT_RELEASE_SECRET;
 const supplied=r.headers.get('x-ycm-settlement-secret');
 if(!configured||!supplied||supplied.length!==configured.length||!timingSafeEqual(Buffer.from(supplied),Buffer.from(configured)))return NextResponse.json({success:false,code:'SETTLEMENT_RELEASE_UNAUTHORIZED'},{status:401});
 try{return NextResponse.json({success:true,policy:'T+1',...(await releaseEligibleSettlements())});}
 catch(e){return NextResponse.json({success:false,code:e instanceof Error?e.message:'SETTLEMENT_RELEASE_FAILED'},{status:500});}
}
