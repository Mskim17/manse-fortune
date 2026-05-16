import { NextRequest, NextResponse } from "next/server";
import { solarToLunar, lunarToSolar, calculateSaju } from "@fullstackfamily/manseryeok";
import { getSupportedRange } from "@fullstackfamily/manseryeok";
console.log(getSupportedRange());

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

  // lunarToSolar 호출 전에 윤달 여부도 시도해보기
  if (isLunar) {
    try {
      let converted;
      try {
        // 평달로 먼저 시도
        converted = lunarToSolar(year, month, day, false);
      } catch {
        // 실패하면 윤달로 시도
        converted = lunarToSolar(year, month, day, true);
      }
      solarYear = converted.solar.year;
      solarMonth = converted.solar.month;
      solarDay = converted.solar.day;
    } catch (e) {
      return NextResponse.json({ 
        error: "이 날짜는 음력 변환이 어려워요. 네이버 '음양력변환'에서 양력으로 변환 후 양력으로 입력해주세요." 
      }, { status: 400 });
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