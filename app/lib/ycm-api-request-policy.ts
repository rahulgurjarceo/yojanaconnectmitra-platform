import { NextRequest, NextResponse } from 'next/server';

const MAX_BODY_BYTES = 2_000_000;
const MUTATING = new Set(['POST','PUT','PATCH','DELETE']);
const SAFE_CONTENT_TYPES = new Set(['application/json','application/x-www-form-urlencoded','multipart/form-data']);

function sameOrigin(request:NextRequest):boolean{
 const origin=request.headers.get('origin');
 if(origin && origin!==request.nextUrl.origin)return false;
 const fetchSite=request.headers.get('sec-fetch-site')?.toLowerCase();
 if(fetchSite && !new Set(['same-origin','same-site','none']).has(fetchSite))return false;
 return true;
}

export function enforceApiRequestPolicy(request:NextRequest):NextResponse|null{
 if(!request.nextUrl.pathname.startsWith('/api/'))return null;
 if(MUTATING.has(request.method)){
  if(!sameOrigin(request))return NextResponse.json({success:false,code:'ORIGIN_POLICY_DENIED'},{status:403});
  const contentType=(request.headers.get('content-type')||'').split(';',1)[0].trim().toLowerCase();
  if(contentType&&!SAFE_CONTENT_TYPES.has(contentType))return NextResponse.json({success:false,code:'CONTENT_TYPE_NOT_ALLOWED'},{status:415});
 }
 const length=request.headers.get('content-length');
 if(length&&Number.isFinite(Number(length))&&Number(length)>MAX_BODY_BYTES)return NextResponse.json({success:false,code:'REQUEST_BODY_TOO_LARGE'},{status:413});
 return null;
}
