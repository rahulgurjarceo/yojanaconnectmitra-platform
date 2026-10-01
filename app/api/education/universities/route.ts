import { NextResponse } from "next/server";
import { searchEducationUniversities, UGC_DEB_DIRECTORY, UGC_UNIVERSITY_DIRECTORY } from "../../education-universities";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = searchEducationUniversities(q).map((u) => ({
    id: u.id,
    name: u.name,
    state: u.state,
    type: u.type,
    verification: {
      universityDirectory: UGC_UNIVERSITY_DIRECTORY.url,
      odlOnlineProgramme: UGC_DEB_DIRECTORY.url,
      status: u.odlonlineStatus,
    },
  }));

  return NextResponse.json({
    success: true,
    query: q,
    count: results.length,
    results,
    next: "Course/session recognition must be verified against the live UGC-DEB programme list before admission.",
  });
}
