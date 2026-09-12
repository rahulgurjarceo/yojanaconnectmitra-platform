import { NextResponse } from 'next/server';
import { YCM_LIFECYCLE, YCM_MODULES } from '../../ycm-architecture';

export async function GET(){
  const counts = {
    total: YCM_MODULES.length,
    foundation: YCM_MODULES.filter(m=>m.status==='foundation').length,
    partial: YCM_MODULES.filter(m=>m.status==='partial').length,
    planned: YCM_MODULES.filter(m=>m.status==='planned').length,
  };
  return NextResponse.json({ success:true, product:'YCM ONE', counts, lifecycle:YCM_LIFECYCLE, modules:YCM_MODULES, operations:['AI Mitra','Door-to-Door','Camps'] });
}
