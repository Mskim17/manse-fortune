import { NextRequest, NextResponse } from "next/server";
import { solarToLunar, lunarToSolar, calculateSaju } from "@fullstackfamily/manseryeok";

export async function POST(req: NextRequest) {
  const { birthYear, birthMonth, birthDay, birthHour, unknownHour, isLunar, targetDate } = await req.json();

  // 입력값 검증
  if (!birthYear || !birthMonth || !birthDay) {
    return NextResponse.json({ error: "생년월일을 모두 입력해주세요." }, { status: 400 });
  }

  const year = Number(birthYear);
  const month = Number(birthMonth);
  const day = Number(birthDay);

  if (year < 1900 || year > 2050) {
    return NextResponse.json({ error: "지원 범위는 1900~2050년이에요." }, { status: 400 });
  }

  // 음력이면 양력으로 변환
  let solarYear = year;
  let solarMonth = month;
  let solarDay = day;

  if (isLunar) {
    try {
      const converted = lunarToSolar(year, month, day, false);
      solarYear = converted.solar.year;   // .solar 추가
      solarMonth = converted.solar.month; // .solar 추가
      solarDay = converted.solar.day;     // .solar 추가
    } catch (e) {
      return NextResponse.json({ error: "음력 변환 실패. 날짜를 확인해주세요." }, { status: 400 });
    }
  }

  // 오늘 일진 계산
  const [tYear, tMonth, tDay] = targetDate.split("-").map(Number);
  const dayInfo = solarToLunar(tYear, tMonth, tDay);

  // 사주 계산
  const saju = unknownHour
    ? calculateSaju(solarYear, solarMonth, solarDay, 0, 0)
    : calculateSaju(solarYear, solarMonth, solarDay, Number(birthHour) || 0, 0);

  return NextResponse.json({
    dayPillar: dayInfo.gapja.dayPillar,
    monthPillar: dayInfo.gapja.monthPillar,
    yearPillar: dayInfo.gapja.yearPillar,
    unknownHour,
    isLunar,
    convertedSolar: isLunar ? { year: solarYear, month: solarMonth, day: solarDay } : null,
    saju: {
      year: saju.yearPillar,
      month: saju.monthPillar,
      day: saju.dayPillar,
      hour: unknownHour ? "-" : saju.hourPillar,
    }
  });
}