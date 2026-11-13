import {NextRequest,NextResponse} from 'next/server';
import postgres from 'postgres';
import {sessionCookieName,verifySession} from '../../../../lib/ycm-access-control';
export const runtime='nodejs';
const db=()=>{const u=process.env.DATABASE_URL||process.env.POSTGRES_URL;return u?postgres(u,{max:4,prepare:false,connect_timeout:10,idle_timeout:20}):null};
const readRoles=['ceo','admin','management','employee','team_lead','branch_manager'];
const writeRoles=['ceo','admin','management'];
const actor=(r:NextRequest)=>verifySession(r.cookies.get(sessionCookieName())?.value);
const fail=(code:string,status:number)=>NextResponse.json({success:false,code},{status});
const cats=['company','product','service','scheme','sales','training','marketing','legal','hr','faq','operations'];
export async function GET(r:NextRequest){
 const s=actor(r);if(!s)return fail('AUTHENTICATION_REQUIRED',401);if(!readRoles.includes(s.role))return fail('FORBIDDEN',403);
 const sql=db();if(!sql)return fail('DATABASE_NOT_CONFIGURED',503);
 try{const u=r.nextUrl, q=(u.searchParams.get('q')||'').trim().slice(0,120), category=u.searchParams.get('category'), language=u.searchParams.get('language');
 const rows=await sql`SELECT id,title,description,category,content_type,body,asset_url,language_code,tags,updated_at FROM ycm_crm_library_items WHERE status='published' AND visibility_roles @> ARRAY[${s.role}]::text[] AND (${q}='' OR to_tsvector('simple',coalesce(title,'')||' '||coalesce(description,'')||' '||coalesce(body,'')) @@ plainto_tsquery('simple',${q}) OR title ILIKE '%'||${q}||'%') AND (${category}::text IS NULL OR category=${category}) AND (${language}::text IS NULL OR language_code=${language}) ORDER BY updated_at DESC LIMIT 100`;
 return NextResponse.json({success:true,items:rows});}catch{return fail('LIBRARY_READ_FAILED',500)}finally{await sql.end({timeout:3})}
}
export async function POST(r:NextRequest){
 const s=actor(r);if(!s)return fail('AUTHENTICATION_REQUIRED',401);if(!writeRoles.includes(s.role))return fail('FORBIDDEN',403);
 const b=await r.json().catch(()=>null);if(!b||typeof b.title!=='string'||!b.title.trim()||b.title.length>180||!cats.includes(b.category)||!['article','pdf','video','image','audio','link','file'].includes(b.contentType||'article')||b.description?.length>2000||b.body?.length>50000||b.assetUrl&&(typeof b.assetUrl!=='string'||!b.assetUrl.startsWith('https://')||b.assetUrl.length>2048))return fail('INVALID_LIBRARY_ITEM',400);
 const roles=Array.isArray(b.visibilityRoles)?b.visibilityRoles.filter((x:string)=>readRoles.includes(x)):readRoles;
 if(!roles.length)return fail('VISIBILITY_REQUIRED',400);
 const sql=db();if(!sql)return fail('DATABASE_NOT_CONFIGURED',503);
 try{const row=(await sql`INSERT INTO ycm_crm_library_items(title,description,category,content_type,body,asset_url,language_code,visibility_roles,geography_state,status,tags,created_by,updated_by) VALUES(${b.title.trim()},${b.description||null},${b.category},${b.contentType||'article'},${b.body||null},${b.assetUrl||null},${b.languageCode||'hi'},${roles},${b.geographyState||null},${b.status==='published'?'published':'draft'},${Array.isArray(b.tags)?b.tags.filter((x:string)=>typeof x==='string').slice(0,20):[]},${s.sub},${s.sub}) RETURNING id,title,category,status,created_at`)[0];return NextResponse.json({success:true,item:row},{status:201});}catch{return fail('LIBRARY_CREATE_FAILED',500)}finally{await sql.end({timeout:3})}
}
