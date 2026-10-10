import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export const runtime = 'nodejs';

const db = () => {
  const u = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return u ? postgres(u, { max: 5, prepare: false, connect_timeout: 10, idle_timeout: 20 }) : null;
};

const clean = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const emailOk = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST(r: NextRequest) {
  const sql = db();
  if (!sql) return NextResponse.json({ success: false, code: 'DATABASE_NOT_CONFIGURED' }, { status: 503 });

  try {
    const b = await r.json().catch(() => ({}));
    if (clean(b.website, 200)) return NextResponse.json({ success: true, accepted: true });

    const name = clean(b.name, 120);
    const mobile = clean(b.mobile, 30);
    const email = clean(b.email, 254);
    const country = clean(b.country, 80) || 'India';
    const marketValue = clean(b.market, 20);
    const market = ['domestic', 'usa', 'international'].includes(marketValue) ? marketValue : 'domestic';
    const projectType = clean(b.projectType, 80);
    const company = clean(b.company, 160);
    const need = clean(b.need, 2000);
    const preferredChannel = clean(b.preferredChannel, 30) || 'whatsapp';

    if (!name || (!mobile && !email) || !emailOk(email) || !need) {
      return NextResponse.json({ success: false, code: 'CONTACT_INPUT_INVALID' }, { status: 400 });
    }

    const metadata = {
      funnel: 'website_contact',
      market,
      country,
      company: company || null,
      projectType: projectType || null,
      preferredChannel,
      page: clean(b.page, 300) || '/',
      consent: Boolean(b.consent),
      receivedAt: new Date().toISOString(),
    };

    const row = (await sql`
      INSERT INTO ycm_leads(source, name, mobile, email, need_text, status, metadata)
      VALUES('website_contact', ${name}, ${mobile || null}, ${email || null}, ${need}, 'new', ${JSON.stringify(metadata)}::jsonb)
      RETURNING lead_id
    `)[0];

    return NextResponse.json({ success: true, accepted: true, leadId: row.lead_id }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, code: 'CONTACT_CREATE_FAILED' }, { status: 400 });
  } finally {
    await sql.end({ timeout: 3 });
  }
}
