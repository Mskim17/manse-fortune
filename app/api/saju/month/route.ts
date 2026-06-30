import { NextRequest, NextResponse } from "next/server";
import { solarToLunar } from "@fullstackfamily/manseryeok";

export async function POST(req: NextRequest) {
  const { year, month } = await req.json();

  if (!year || !month) {
    return NextResponse.json({ error: "년월을 입력해주세요." }, { status: 400 });
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const results: { date: string; dayPillar: string }[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    try {
      const dayInfo = solarToLunar(year, month, day);
      results.push({
        date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        dayPillar: dayInfo.gapja.dayPillar,
      });
    } catch {
      // 변환 실패 날짜는 스킵
    }
  }

  return NextResponse.json({ days: results });
}