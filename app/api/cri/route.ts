import { NextResponse } from 'next/server';
import { calculateCRI, type CriInput } from '../../cri';

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as CriInput;
    const result = calculateCRI(input);
    return NextResponse.json({ success: true, cri: result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid CRI request' }, { status: 400 });
  }
}
