import { NextRequest, NextResponse } from "next/server";
import { requireYcmSession } from "@/app/lib/ycm-auth";

function scoreProfile(p: any) {
  const banking = (p.bank_branch_count ?? 0) + (p.atm_count ?? 0) + (p.banking_correspondent_count ?? 0);
  const bankingGap = banking === 0 ? 100 : banking === 1 ? 75 : banking < 4 ? 40 : 10;
  const insurance = p.insured_population_pct == null ? 60 : p.insured_population_pct < 25 ? 100 : p.insured_population_pct < 50 ? 70 : p.insured_population_pct < 75 ? 35 : 10;
  const students = p.student_count ?? 0;
  const schools = p.government_school_count ?? 0;
  const schoolGap = students >= 100 && schools === 0 ? 100 : students >= 50 && schools === 0 ? 85 : p.nearest_government_school_km != null && p.nearest_government_school_km > 5 ? 75 : schools === 0 ? 50 : 10;
  const score = Math.round(bankingGap * 0.35 + insurance * 0.30 + schoolGap * 0.35);
  return { score, priority: score >= 75 ? "high" : score >= 50 ? "medium" : "low", signals: { bankingGap, insuranceGap: insurance, schoolGap } };
}

export async function GET(req: NextRequest) {
  const session = await requireYcmSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ message: "Village Opportunity Intelligence API", scoring: "banking 35% · insurance 30% · school 35%", example: scoreProfile({ bank_branch_count: 0, atm_count: 0, banking_correspondent_count: 0, insured_population_pct: 20, student_count: 100, government_school_count: 0 }) });
}

export async function POST(req: NextRequest) {
  const session = await requireYcmSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  return NextResponse.json({ profile: body, intelligence: scoreProfile(body) }, { status: 201 });
}
