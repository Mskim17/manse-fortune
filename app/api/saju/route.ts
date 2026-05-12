import { NextRequest, NextResponse } from "next/server";
import { solarToLunar, calculateSaju } from "@fullstackfamily/manseryeok";

export async function POST(req: NextRequest) {
  const { birthYear, birthMonth, birthDay, birthHour, unknownHour, targetDate } = await req.json();

  const [year, month, day] = targetDate.split("-").map(Number);
  const dayInfo = solarToLunar(year, month, day);

  // 시간 모를 때 시주 계산 안함
  const saju = unknownHour
    ? calculateSaju(birthYear, birthMonth, birthDay, 0, 0)
    : calculateSaju(birthYear, birthMonth, birthDay, birthHour, 0);

  return NextResponse.json({
    dayPillar: dayInfo.gapja.dayPillar,
    monthPillar: dayInfo.gapja.monthPillar,
    yearPillar: dayInfo.gapja.yearPillar,
    unknownHour,
    saju: {
      year: saju.yearPillar,
      month: saju.monthPillar,
      day: saju.dayPillar,
      hour: unknownHour ? "-" : saju.hourPillar,
    }
  });
}