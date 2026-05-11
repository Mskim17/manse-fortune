import { NextRequest, NextResponse } from "next/server";
import { solarToLunar, calculateSaju } from "@fullstackfamily/manseryeok";

export async function POST(req: NextRequest) {
  const { birthYear, birthMonth, birthDay, birthHour, targetDate } = await req.json();

  // 오늘 일진 계산
  const [year, month, day] = targetDate.split("-").map(Number);
  const dayInfo = solarToLunar(year, month, day);

  // 사주 계산
  const saju = calculateSaju(birthYear, birthMonth, birthDay, birthHour, 0);

  return NextResponse.json({
    dayPillar: dayInfo.gapja.dayPillar,      // 오늘 일진
    monthPillar: dayInfo.gapja.monthPillar,  // 월건
    yearPillar: dayInfo.gapja.yearPillar,    // 세운
    saju: {
      year: saju.yearPillar,
      month: saju.monthPillar,
      day: saju.dayPillar,
      hour: saju.hourPillar,
    }
  });
}