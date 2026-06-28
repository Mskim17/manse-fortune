"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface BirthInfo {
  year: number | "";
  month: number | "";
  day: number | "";
  hour: number | "";
  minute: number | "";
  name: string;
  unknownHour: boolean;
  isLunar: boolean;
}

interface FortuneResult {
  dayPillar: string;
  monthPillar: string;
  yearPillar: string;
  unknownHour: boolean;
  isLunar: boolean;
  convertedSolar: { year: number; month: number; day: number } | null;
  saju: { year: string; month: string; day: string; hour: string };
  analysis: {
    tenGod: string;
    jijiRelation: { type: string; desc: string } | null;
    energy: string;
    colors: { name: string; hex: string; desc: string }[];
    direction: string;
    colorBasis: string;
    advice: string;
    caution: string;
    activity: string;
    elementScore: {
      scores: { 목: number; 화: number; 토: number; 금: number; 수: number };
      total: number;
      dominant: string | null;
      tripleChar: string | null;
      percentage: Record<string, number>;
    };
    dominantText: string | null;
    tripleText: string | null;
    johu: {
      status: "극열" | "극한" | "평이" | "풍습" | "조조" | "토중" | "냉금";
      label: string;
      yongsin: string;
      solution: string[];
    };
    strength: {
      strength: "신강" | "신약" | "중화";
      score: number;
      desc: string;
    };
    geokkuk: {
      name: string;
      tenGod: string;
      desc: string;
      yongsin: string;
      yongsinEl: string;
    };
    yongsin: {
      yongsinEl: string;
      yongsin: string;
      heesinEl: string;
      heesin: string;
      gisinEl: string;
      gisин: string;
      gusinEl: string;
      gusin: string;
      hansinEl: string;
      hansin: string;
      desc: string;
    };
  };
}

// ── 오행 매핑 ──
const ganToElement: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};

const jiToElement: Record<string, string> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토",
  사: "화", 오: "화", 미: "토", 신: "금", 유: "금",
  술: "토", 해: "수",
};

// ── 오행별 색상 ──
const elementColorCodes: Record<string, { name: string; hex: string; desc: string }[]> = {
  목: [
    { name: "포레스트그린", hex: "#2D5A1B", desc: "목 기운 강화. 메인" },
    { name: "올리브·카키", hex: "#6B6B2A", desc: "土와 조화. 서브" },
    { name: "크림·베이지", hex: "#F5F0E8", desc: "포인트. 소품" },
  ],
  화: [
    { name: "버건디·레드", hex: "#8B1A1A", desc: "화 기운 강화. 메인" },
    { name: "오렌지·핑크", hex: "#C8640A", desc: "활동 에너지. 서브" },
    { name: "아이보리", hex: "#FFFFF0", desc: "균형. 포인트" },
  ],
  토: [
    { name: "머스타드·옐로", hex: "#C9A020", desc: "토 기운 강화. 메인" },
    { name: "브라운·카멜", hex: "#7B4B2A", desc: "안정감. 서브" },
    { name: "크림·베이지", hex: "#F5F0E8", desc: "포인트. 소품" },
  ],
  금: [
    { name: "실버·라이트그레이", hex: "#C0C0C0", desc: "금 기운 강화. 메인" },
    { name: "화이트·오프화이트", hex: "#F8F8F8", desc: "청결함. 서브" },
    { name: "다크네이비", hex: "#1a3a5c", desc: "포인트" },
  ],
  수: [
    { name: "다크네이비·블랙", hex: "#1a3a5c", desc: "수 기운 강화. 메인" },
    { name: "차콜·다크그레이", hex: "#2D2D2D", desc: "깊이감. 서브" },
    { name: "실버·그레이", hex: "#C0C0C0", desc: "균형. 포인트" },
  ],
};

// ── 오행별 방향 ──
const elementDirection: Record<string, string> = {
  목: "동쪽·동남쪽",
  화: "남쪽·동남쪽",
  토: "중앙·남서쪽",
  금: "서쪽·북서쪽",
  수: "북쪽·북서쪽",
};

// ── 추천 색상 계산 ──
const getColors = (
  sajuDay: string,
  strength: { strength: "신강" | "신약" | "중화"; score: number },
  johu: { status: string; yongsinEl: string },
  dayPillar: string,
  yongsin?: { yongsinEl: string; heesinEl: string },
) => {
  const dayEl = ganToElement[sajuDay[0]];
  const dayPillarEl = ganToElement[dayPillar[0]];

  let targetEl = dayPillarEl;
  let basis = "일진 기준";

  // 1순위: 억부용신
  if (yongsin?.yongsinEl) {
    targetEl = yongsin.yongsinEl;
    basis = "억부용신 기준";
  } else if (strength.strength === "신약") {
    const insungEl: Record<string, string> = {
      목: "수", 화: "목", 토: "화", 금: "토", 수: "금",
    };
    targetEl = insungEl[dayEl];
    basis = "신약 기준";
  } else if (strength.strength === "신강") {
    const setGi: Record<string, string> = {
      목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
    };
    targetEl = setGi[dayEl];
    basis = "신강 기준";
  }

  // 2순위: 극열·극한 조후 override
  if (["극열", "극한"].includes(johu.status) && johu.yongsinEl) {
    targetEl = johu.yongsinEl;
    basis = `조후(${johu.status}) 기준`;
  }

  // 중화이면서 억부용신 없으면 조후
  if (strength.strength === "중화" && !yongsin?.yongsinEl) {
    if (johu.yongsinEl && johu.status !== "평이") {
      targetEl = johu.yongsinEl;
      basis = `조후(${johu.status}) 기준`;
    } else {
      targetEl = dayPillarEl;
      basis = "일진 기준";
    }
  }

  return {
    colors: elementColorCodes[targetEl] || elementColorCodes["금"],
    direction: elementDirection[targetEl],
    element: targetEl,
    basis,
  };
};

// ── 오행 점수 계산 ──
interface ElementScore {
  목: number; 화: number; 토: number; 금: number; 수: number;
}

const calcElementScore = (
  saju: { year: string; month: string; day: string; hour: string },
  dayPillar: string,
  monthPillar: string,
) => {
  const scores: ElementScore = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const monthJi = monthPillar[1] || "";
  const monthJiElement = jiToElement[monthJi] || "";
  const allPillars = [saju.year, saju.month, saju.day, saju.hour, dayPillar];
  const allChars: string[] = [];

  allPillars.forEach((pillar) => {
    if (!pillar || pillar === "미상") return;
    if (pillar[0]) allChars.push(pillar[0]);
    if (pillar[1]) allChars.push(pillar[1]);
  });

  allChars.forEach((char) => {
    const el = ganToElement[char] || jiToElement[char];
    if (!el) return;
    const isMonthJi = jiToElement[char] === monthJiElement && !!jiToElement[char];
    scores[el as keyof ElementScore] += isMonthJi ? 30 : 10;
  });

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const percentage: Record<string, number> = {};
  Object.entries(scores).forEach(([k, v]) => {
    percentage[k] = Math.round((v / total) * 100);
  });

  const dominant = Object.entries(percentage).find(([, v]) => v >= 45)?.[0] || null;

  const jiChars = allPillars
    .filter((p) => p && p !== "미상")
    .map((p) => p[1])
    .filter(Boolean);
  const jiCount: Record<string, number> = {};
  jiChars.forEach((j) => { jiCount[j] = (jiCount[j] || 0) + 1; });
  const tripleChar = Object.entries(jiCount).find(([, v]) => v >= 3)?.[0] || null;

  return { scores, total, dominant, tripleChar, percentage };
};

// ── 신강/신약 판단 ──
const calcStrength = (
  saju: { year: string; month: string; day: string; hour: string },
  dayPillar: string,
  monthPillar: string,
): {
  strength: "신강" | "신약" | "중화";
  score: number;
  desc: string;
} => {
  const dayGan = dayPillar[0];
  const dayEl = ganToElement[dayGan];

  // 인성 오행 (나를 생해주는 오행)
  const insungEl: Record<string, string> = {
    목: "수", 화: "목", 토: "화", 금: "토", 수: "금",
  };
  const sameEl = dayEl;
  const inEl = insungEl[dayEl];

  // ── 지장간 테이블 ──
  const jiJangGan: Record<string, { gan: string; ratio: number }[]> = {
    자: [{ gan: "계", ratio: 1.0 }],
    축: [{ gan: "기", ratio: 0.6 }, { gan: "신", ratio: 0.3 }, { gan: "계", ratio: 0.1 }],
    인: [{ gan: "갑", ratio: 0.6 }, { gan: "병", ratio: 0.3 }, { gan: "무", ratio: 0.1 }],
    묘: [{ gan: "을", ratio: 1.0 }],
    진: [{ gan: "무", ratio: 0.6 }, { gan: "을", ratio: 0.3 }, { gan: "계", ratio: 0.1 }],
    사: [{ gan: "병", ratio: 0.6 }, { gan: "경", ratio: 0.3 }, { gan: "무", ratio: 0.1 }],
    오: [{ gan: "정", ratio: 0.7 }, { gan: "기", ratio: 0.3 }],
    미: [{ gan: "기", ratio: 0.6 }, { gan: "을", ratio: 0.3 }, { gan: "정", ratio: 0.1 }],
    신: [{ gan: "경", ratio: 0.6 }, { gan: "임", ratio: 0.3 }, { gan: "무", ratio: 0.1 }],
    유: [{ gan: "신", ratio: 1.0 }],
    술: [{ gan: "무", ratio: 0.6 }, { gan: "신", ratio: 0.3 }, { gan: "정", ratio: 0.1 }],
    해: [{ gan: "임", ratio: 0.6 }, { gan: "갑", ratio: 0.4 }],
  };
  
  const monthJi = monthPillar[1] || "";
  const monthJiEl = jiToElement[monthJi] || "";

  let supportScore = 0;
  let weakenScore = 0;

  const allPillars = [saju.year, saju.month, saju.day, saju.hour];

  allPillars.forEach((pillar, pillarIdx) => {
    if (!pillar || pillar === "미상") return;
    const gan = pillar[0];
    const ji = pillar[1];

    // 천간 계산
    if (gan) {
      const el = ganToElement[gan];
      if (el) {
        // 일간 자체는 제외
        if (pillarIdx === 2 && gan === dayGan) return;

        // 월지 해당 오행이면 가중치 1.5배
        const isMonthJiEl = el === monthJiEl;
        const point = isMonthJiEl ? 1.5 : 1;

        if (el === sameEl || el === inEl) {
          supportScore += point;
        } else {
          weakenScore += point;
        }
      }
    }
    
    // 지지 계산 (지장간 비율 반영)
    if (ji && jiJangGan[ji]) {
      const isMonthJi = ji === monthJi;
      const basePoint = isMonthJi ? 3 : 1;  // 월지 3배 가중치

      jiJangGan[ji].forEach(({ gan: jgGan, ratio }) => {
        const el = ganToElement[jgGan];
        if (!el) return;
        const point = basePoint * ratio;
        if (el === sameEl || el === inEl) {
          supportScore += point;
        } else {
          weakenScore += point;
        }
      });
    }
  });
  
  const total = supportScore + weakenScore;
  const ratio = supportScore / total;
  const score = parseFloat((ratio * 100).toFixed(1));

  let strength: "신강" | "신약" | "중화";
  let desc: string;

  if (ratio >= 0.60) {
    strength = "신강";
    desc = "일간의 기운이 강해요. 오늘은 에너지가 넘치지만 지나치게 고집스러워질 수 있어요. 설기(식상·재성) 활동으로 에너지를 발산하는 게 좋아요.";
  } else if (ratio <= 0.40) {
    strength = "신약";
    desc = "일간의 기운이 약해요. 오늘은 체력 소모에 주의하고 무리한 계획보다 내실 있는 하루를 보내세요. 인성·비겁 기운으로 충전이 필요해요.";
  } else {
    strength = "중화";
    desc = "일간의 기운이 균형 잡혀 있어요. 오늘은 어떤 활동도 무난하게 소화할 수 있는 안정적인 날이에요.";
  }

  return { strength, score, desc };
};

// ── 격국 판단 ──
const calcGeokkuk = (
  saju: { year: string; month: string; day: string; hour: string },
  dayPillar: string,
  monthPillar: string,
): {
  name: string;
  tenGod: string;
  desc: string;
  yongsin: string;
  yongsinEl: string;
} => {

  const jiJangGan: Record<string, { gan: string; ratio: number }[]> = {
    자: [{ gan: "계", ratio: 1.0 }],
    축: [{ gan: "기", ratio: 0.6 }, { gan: "신", ratio: 0.3 }, { gan: "계", ratio: 0.1 }],
    인: [{ gan: "갑", ratio: 0.6 }, { gan: "병", ratio: 0.3 }, { gan: "무", ratio: 0.1 }],
    묘: [{ gan: "을", ratio: 1.0 }],
    진: [{ gan: "무", ratio: 0.6 }, { gan: "을", ratio: 0.3 }, { gan: "계", ratio: 0.1 }],
    사: [{ gan: "병", ratio: 0.6 }, { gan: "경", ratio: 0.3 }, { gan: "무", ratio: 0.1 }],
    오: [{ gan: "정", ratio: 0.7 }, { gan: "기", ratio: 0.3 }],
    미: [{ gan: "기", ratio: 0.6 }, { gan: "을", ratio: 0.3 }, { gan: "정", ratio: 0.1 }],
    신: [{ gan: "경", ratio: 0.6 }, { gan: "임", ratio: 0.3 }, { gan: "무", ratio: 0.1 }],
    유: [{ gan: "신", ratio: 1.0 }],
    술: [{ gan: "무", ratio: 0.6 }, { gan: "신", ratio: 0.3 }, { gan: "정", ratio: 0.1 }],
    해: [{ gan: "임", ratio: 0.6 }, { gan: "갑", ratio: 0.4 }],
  };

  const dayGan = dayPillar[0];
  const monthJi = monthPillar[1] || "";
  const monthJiGans = jiJangGan[monthJi] || [];

  // 사주 천간 전체 수집 (일간 제외)
  const allGans = [
    saju.year[0], saju.month[0], saju.hour[0],
  ].filter(Boolean);

  // 투간 여부 확인 (월지 지장간이 사주 천간에 있는지)
  let formatGan: string | null = null;
  for (const { gan } of monthJiGans) {
    if (allGans.includes(gan)) {
      formatGan = gan;
      break;
    }
  }

  // 투간 없으면 월지 본기(가장 비율 높은 지장간) 사용
  if (!formatGan) {
    formatGan = monthJiGans[0]?.gan || "";
  }

  // 격국 천간 기준 십신 계산
  const formatEl = ganToElement[formatGan] || "";
  const dayEl = ganToElement[dayGan] || "";
  const dayYin = ["을", "정", "기", "신", "계"].includes(dayGan);
  const formatYin = ["을", "정", "기", "신", "계"].includes(formatGan);

  const gen: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  const con: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };

  let tenGod = "기타";
  if (formatEl === dayEl) {
    tenGod = dayYin === formatYin ? "비견" : "겁재";
  } else if (gen[dayEl] === formatEl) {
    tenGod = dayYin === formatYin ? "식신" : "상관";
  } else if (gen[formatEl] === dayEl) {
    tenGod = dayYin === formatYin ? "편인" : "정인";
  } else if (con[dayEl] === formatEl) {
    tenGod = dayYin === formatYin ? "편재" : "정재";
  } else if (con[formatEl] === dayEl) {
    tenGod = dayYin === formatYin ? "편관" : "정관";
  }

  // 격국명
  const geokkukName: Record<string, string> = {
    비견: "건록격(建祿格)",
    겁재: "양인격(羊刃格)",
    식신: "식신격(食神格)",
    상관: "상관격(傷官格)",
    편재: "편재격(偏財格)",
    정재: "정재격(正財格)",
    편관: "편관격(偏官格)",
    정관: "정관격(正官格)",
    편인: "편인격(偏印格)",
    정인: "정인격(正印格)",
  };

  // 격국별 용신 (신강 기준 기본값)
  // 실제로는 신강/신약 결합해서 판단해야 함
  const geokkukYongsin: Record<string, { yongsin: string; yongsinEl: string; desc: string }> = {
    식신격: {
      yongsin: "재성(財星)",
      yongsinEl: con[formatEl] || "",
      desc: "식신이 재성을 생해 재물과 표현력이 강한 격이에요. 창의적 활동과 수익 창출에 유리해요.",
    },
    상관격: {
      yongsin: "재성(財星) 또는 인성(印星)",
      yongsinEl: con[formatEl] || "",
      desc: "상관이 강해 표현력과 반골 기질이 강한 격이에요. 예술·기술·자유업에 유리하나 관성을 극하므로 주의가 필요해요.",
    },
    편재격: {
      yongsin: "식상(食傷)",
      yongsinEl: gen[dayEl] || "",
      desc: "편재가 강해 활동력과 재물 운이 강한 격이에요. 사업·투자·영업에 유리해요.",
    },
    정재격: {
      yongsin: "식상(食傷) 또는 관성(官星)",
      yongsinEl: gen[dayEl] || "",
      desc: "정재가 강해 성실하고 안정적인 재물 운을 가진 격이에요. 꼼꼼한 재무 관리에 탁월해요.",
    },
    편관격: {
      yongsin: "식신(食神)",
      yongsinEl: gen[dayEl] || "",
      desc: "편관이 강해 도전·극복 기질이 강한 격이에요. 군·경·법조·리더십 분야에 유리해요.",
    },
    정관격: {
      yongsin: "재성(財星) 또는 인성(印星)",
      yongsinEl: con[dayEl] || "",
      desc: "정관이 강해 명예와 책임감이 강한 격이에요. 공직·관리직·조직 생활에 유리해요.",
    },
    편인격: {
      yongsin: "재성(財星)",
      yongsinEl: con[formatEl] || "",
      desc: "편인이 강해 직관과 학문적 기질이 강한 격이에요. 연구·철학·종교·예술 분야에 유리해요.",
    },
    정인격: {
      yongsin: "관성(官星)",
      yongsinEl: con[dayEl] || "",
      desc: "정인이 강해 학습과 내면 정리 능력이 뛰어난 격이에요. 교육·문화·학문 분야에 유리해요.",
    },
    건록격: {
      yongsin: "재성(財星) 또는 관성(官星)",
      yongsinEl: con[dayEl] || "",
      desc: "일간과 같은 오행이 강해 독립심과 자립 기질이 강한 격이에요. 자영업·리더십에 유리해요.",
    },
    양인격: {
      yongsin: "관성(官星)",
      yongsinEl: con[dayEl] || "",
      desc: "겁재가 강해 추진력과 경쟁심이 강한 격이에요. 강한 에너지를 관성으로 제어해야 해요.",
    },
  };

  const name = geokkukName[tenGod] || "잡격(雜格)";
  const yongsinInfo = geokkukYongsin[name.split("(")[0]] || {
    yongsin: "균형",
    yongsinEl: "",
    desc: "복합적인 구조로 개인 상황에 따라 용신이 달라져요.",
  };

  return {
    name,
    tenGod,
    desc: yongsinInfo.desc,
    yongsin: yongsinInfo.yongsin,
    yongsinEl: yongsinInfo.yongsinEl,
  };
};

// ── 억부용신 계산 ──
const calcYongsin = (
  strength: { strength: "신강" | "신약" | "중화"; score: number },
  geokkuk: { name: string; tenGod: string; yongsinEl: string },
  dayPillar: string,
  monthPillar: string,
): {
  yongsinEl: string;
  yongsin: string;
  heesinEl: string;
  heesin: string;
  gisinEl: string;
  gisин: string;
  gusinEl: string;   // 추가
  gusin: string;     // 추가
  hansinEl: string;  // 추가
  hansin: string;    // 추가
  desc: string;
} => {
  const dayGan = dayPillar[0];
  const dayEl = ganToElement[dayGan];

  const gen: Record<string, string> = {
    목: "화", 화: "토", 토: "금", 금: "수", 수: "목",
  };
  const con: Record<string, string> = {
    목: "토", 화: "금", 토: "수", 금: "목", 수: "화",
  };
  const insungEl: Record<string, string> = {
    목: "수", 화: "목", 토: "화", 금: "토", 수: "금",
  };

  const elName: Record<string, string> = {
    목: "목(木)", 화: "화(火)", 토: "토(土)", 금: "금(金)", 수: "수(水)",
  };

  let yongsinEl = "";
  let gisinEl = "";
  let heesinEl = "";
  let desc = "";

  const { tenGod } = geokkuk;

  if (strength.strength === "신강") {
    // 신강 → 설기·극 오행이 용신
    // 격국별 세분화
    if (["식신", "상관"].includes(tenGod)) {
      // 식신격·상관격 신강 → 재성 용신
      yongsinEl = con[dayEl];
      heesinEl = gen[dayEl];  // 식상 (희신 - 재성 생해줌)
      gisinEl = insungEl[dayEl];  // 인성 (기신 - 식상 극함)
      desc = `${geokkuk.name} 신강 사주예요. 식상이 강하니 재성(${elName[con[dayEl]]})으로 에너지를 흘려보내는 것이 좋아요. 창의력을 재물로 연결하는 활동이 유리해요.`;
    } else if (["편재", "정재"].includes(tenGod)) {
      // 재격 신강 → 관성 용신
      yongsinEl = con[con[dayEl]];  // 재성을 극하는 관성
      heesinEl = con[dayEl];  // 재성 (희신)
      gisinEl = insungEl[dayEl];  // 인성 (기신)
      desc = `${geokkuk.name} 신강 사주예요. 재성이 강하니 관성(${elName[con[con[dayEl]]]})으로 균형을 잡아야 해요. 책임감과 규율로 재물을 관리하는 것이 유리해요.`;
    } else if (["편관", "정관"].includes(tenGod)) {
      // 관격 신강 → 식신 용신 (관 제어)
      yongsinEl = gen[dayEl];
      heesinEl = con[dayEl];  // 재성 (희신 - 관 생해줌)
      gisinEl = insungEl[dayEl];  // 인성 (기신)
      desc = `${geokkuk.name} 신강 사주예요. 관성의 압박을 식상(${elName[gen[dayEl]]})으로 제어해야 해요. 창의적 표현으로 스트레스를 해소하는 것이 좋아요.`;
    } else if (["편인", "정인"].includes(tenGod)) {
      // 인격 신강 → 재성 용신 (인성 제어)
      yongsinEl = con[insungEl[dayEl]];  // 인성을 극하는 재성
      heesinEl = con[dayEl];
      gisinEl = insungEl[dayEl];
      desc = `${geokkuk.name} 신강 사주예요. 인성이 과다하니 재성(${elName[con[insungEl[dayEl]]]})으로 균형을 잡아야 해요. 학습한 것을 실용적으로 활용하는 것이 좋아요.`;
    } else {
      // 건록격·양인격 신강
      yongsinEl = con[dayEl];  // 재성
      heesinEl = gen[dayEl];
      gisinEl = insungEl[dayEl];
      desc = `${geokkuk.name} 신강 사주예요. 강한 기운을 재성(${elName[con[dayEl]]})이나 관성으로 설기해야 해요. 활동적이고 도전적인 일에 에너지를 쏟는 것이 좋아요.`;
    }
  } else if (strength.strength === "신약") {
    // 신약 → 비겁·인성이 용신
    if (["편관", "정관"].includes(tenGod)) {
      // 관격 신약 → 인성 용신 (관이 인성 생하게)
      yongsinEl = insungEl[dayEl];
      heesinEl = dayEl;  // 비겁 (희신)
      gisinEl = con[dayEl];  // 재성 (기신 - 인성 극함)
      desc = `${geokkuk.name} 신약 사주예요. 관성의 압박이 강하니 인성(${elName[insungEl[dayEl]]})으로 일간을 보강해야 해요. 학습과 내실을 다지는 활동이 유리해요.`;
    } else if (["식신", "상관"].includes(tenGod)) {
      // 식상격 신약 → 비겁 용신 (설기 막기)
      yongsinEl = dayEl;  // 비겁
      heesinEl = insungEl[dayEl];  // 인성 (희신)
      gisinEl = gen[dayEl];  // 식상 (기신 - 설기함)
      desc = `${geokkuk.name} 신약 사주예요. 식상이 일간을 설기하니 비겁(${elName[dayEl]})으로 기운을 보강해야 해요. 무리한 표현·활동보다 충전하는 날로 쓰는 것이 좋아요.`;
    } else if (["편재", "정재"].includes(tenGod)) {
      // 재격 신약 → 비겁 용신
      yongsinEl = dayEl;  // 비겁
      heesinEl = insungEl[dayEl];  // 인성
      gisinEl = con[dayEl];  // 재성 (기신)
      desc = `${geokkuk.name} 신약 사주예요. 재성이 일간을 극하니 비겁(${elName[dayEl]})으로 기운을 보강해야 해요. 무리한 지출·투자보다 내실을 다지는 것이 좋아요.`;
    } else {
      // 인격·기타 신약 → 인성 용신
      yongsinEl = insungEl[dayEl];
      heesinEl = dayEl;  // 비겁
      gisinEl = con[insungEl[dayEl]];  // 재성 (인성 극함)
      desc = `${geokkuk.name} 신약 사주예요. 인성(${elName[insungEl[dayEl]]})으로 일간을 보강하는 것이 좋아요. 학습·휴식·내면 충전에 집중하는 날이에요.`;
    }
  } else {
    // 중화 → 격국 용신 따름
    yongsinEl = geokkuk.yongsinEl || dayEl;
    heesinEl = insungEl[yongsinEl] || "";
    gisinEl = con[yongsinEl] || "";
    desc = `${geokkuk.name} 중화 사주예요. 격국 용신인 ${elName[yongsinEl] || "균형"}을 활용하는 것이 좋아요. 균형 잡힌 하루를 보낼 수 있어요.`;
  }

  // 희신 = 용신을 생해주는 오행
  heesinEl = insungEl[yongsinEl] || heesinEl;
  // 기신 = 용신을 극하는 오행
  gisinEl = con[yongsinEl] || gisinEl;
  // 구신 = 기신을 생해주는 오행 (기신 강화)
  const gusinEl = insungEl[gisinEl] || "";
  // 한신 = 용신·기신 어느쪽도 아닌 중립
  const allEl = ["목", "화", "토", "금", "수"];
  const hansinEl = allEl.find(
    (el) => el !== yongsinEl && el !== heesinEl && el !== gisinEl && el !== gusinEl
  ) || "";

  return {
    yongsinEl,
    yongsin: elName[yongsinEl] || "균형",
    heesinEl,
    heesin: elName[heesinEl] || "",
    gisinEl,
    gisин: elName[gisinEl] || "",
    gusinEl,
    gusin: elName[gusinEl] || "",
    hansinEl,
    hansin: elName[hansinEl] || "",
    desc,
  };
};

// ── 조후 판단 ──
const getJohu = (
  monthPillar: string,
  dayPillar: string,
  scores: ElementScore,
  total: number,
) => {
  const monthJi = monthPillar[1] || "";

  const summerJi = ["사", "오", "미"];
  const winterJi = ["해", "자", "축"];
  const springJi = ["인", "묘"];
  const autumnJi = ["신", "유"];
  const changeJi = ["진", "미", "술", "축"];

  const isSummer = summerJi.includes(monthJi);
  const isWinter = winterJi.includes(monthJi);
  const isSpring = springJi.includes(monthJi);
  const isAutumn = autumnJi.includes(monthJi);
  const isChange = changeJi.includes(monthJi);

  // 오행 비율 계산
  const ratio = {
    목: scores.목 / total,
    화: scores.화 / total,
    토: scores.토 / total,
    금: scores.금 / total,
    수: scores.수 / total,
  };

  // 35% 이상인 과다 오행들을 크기순으로 정렬하여 추출
  const overElements = Object.entries(ratio)
    .filter(([, v]) => v >= 0.35)
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => k);

  const topElement = overElements[0] || null;
  const subElement = overElements[1] || null;

  // 과다 오행이 없으면 평이 (조후 안정)
  if (!topElement) {
    return {
      status: "평이" as const,
      label: "균형 ☯️",
      yongsin: "",
      yongsinEl: "",
      solution: ["조후가 안정적이에요. 원하시는 활동을 자유롭게 진행하셔도 좋아요."],
      colors: null,
      direction: null,
    };
  }

  // 1. 상태(Status) 및 라벨(Label) 결정 로직 (계절 및 복합 조건 우선)
  let status: "극열" | "조조" | "극한" | "냉금" | "풍습" | "토중" | "균형" = "균형";
  let label = "균형 ☯️";
  let yongsinEl = "토"; // 기본값 초기화

  // 기본 억부 상극 관계 정의
  const baseControl: Record<string, string> = {
    목: "금", 화: "수", 토: "목", 금: "화", 수: "토",
  };
  yongsinEl = baseControl[topElement];

  // 상세 조건 분기 분리
  if (isSummer) {
    // 여름철 화금상쟁 복합 과다 케이스
    if ((topElement === "화" && subElement === "금") || (topElement === "금" && subElement === "화")) {
      status = "조조";
      label = "燥熱 (조열) 🌞 [화금상쟁]";
      yongsinEl = "토"; 
    } else if (topElement === "화") {
      status = "극열";
      label = "極熱 (극열) 🔥";
      yongsinEl = "수";
    } else if (topElement === "금") {
      status = "조조";
      label = "燥熱 (조열) 🌞 [여름금다]";
      yongsinEl = "수"; // 🔥 [수정] 여름 조열 사주의 금 과다는 화가 아닌 수로 식혀야 함
    }
  } else if (isWinter) {
    if (topElement === "수") {
      status = "극한";
      label = "極寒 (극한) ❄️";
      yongsinEl = "화";
    } else if (topElement === "금") {
      status = "냉금";
      label = "冷金 (냉금) 🌨️";
      yongsinEl = "화";
    }
  } else if (isSpring && topElement === "목") {
    status = "풍습";
    label = "風濕 (풍습) 🌿";
    yongsinEl = "금";
  } else if (isAutumn && topElement === "금") {
    status = "조조";
    label = "燥熱 (조조) 🍂";
    yongsinEl = "화"; // 가을 숙살지기는 화로 제련
  } else if (isChange && topElement === "토") {
    status = "토중";
    label = "土重 (토중) 🌍";
    yongsinEl = "목";
  } else {
    // 계절 특수성이 없는 일반 과다
    const generalMap: Record<string, { status: "극열" | "극한" | "풍습" | "조조" | "토중" | "냉금" | "균형"; label: string }> = {
      화: { status: "극열", label: "火多 (화다) 🔥" },
      수: { status: "극한", label: "水多 (수다) 💧" },
      목: { status: "풍습", label: "木多 (목다) 🌳" },
      금: { status: "조조", label: "金多 (금다) ⚙️" },
      토: { status: "토중", label: "土多 (토다) 🌍" },
    };
    status = generalMap[topElement].status;
    label = generalMap[topElement].label;
  }

  // 데이터 맵 정의 (색상, 방향 등)
  const elementColorMap: Record<string, { name: string; hex: string; desc: string }[]> = {
    목: [{ name: "포레스트그린", hex: "#2D5A1B", desc: "목 기운 강화" }, { name: "올리브", hex: "#6B6B2A", desc: "서브" }, { name: "베이지", hex: "#F5F0E8", desc: "포인트" }],
    화: [{ name: "버건디·레드", hex: "#8B1A1A", desc: "화 기운 강화" }, { name: "오렌지", hex: "#C8640A", desc: "서브" }, { name: "아이보리", hex: "#FFFFF0", desc: "포인트" }],
    토: [{ name: "머스타드·옐로", hex: "#C9A020", desc: "토 기운 강화" }, { name: "브라운", hex: "#7B4B2A", desc: "서브" }, { name: "베이지", hex: "#F5F0E8", desc: "포인트" }],
    금: [{ name: "실버·그레이", hex: "#C0C0C0", desc: "금 기운 강화" }, { name: "화이트", hex: "#F8F8F8", desc: "서브" }, { name: "네이비", hex: "#1a3a5c", desc: "포인트" }],
    수: [{ name: "다크네이비·블랙", hex: "#1a3a5c", desc: "수 기운 강화" }, { name: "차콜", hex: "#2D2D2D", desc: "서브" }, { name: "실버", hex: "#C0C0C0", desc: "포인트" }],
  };

  const elementDirectionMap: Record<string, string> = {
    목: "동쪽·동남쪽", 화: "남쪽·동남쪽", 토: "중앙·남서쪽", 금: "서쪽·북서쪽", 수: "북쪽·북서쪽",
  };

  const yongsinName: Record<string, string> = {
    목: "목(木)", 화: "화(火)", 토: "토(土)", 금: "금(金)", 수: "수(水)",
  };

  // 용신 맞춤형 최종 동적 솔루션 매칭
  const yongsinSolutions: Record<string, string[]> = {
    수: ["수(水) 기운으로 균형 — 검은색·네이비 의상 착용", "수분을 충분히 보충하세요", "조급함과 열감을 식히고 잠시 멈추어 호흡하세요", "직사광선과 고온의 환경을 피하고 서늘함을 유지하세요"],
    화: ["화(火) 기운으로 균형 — 붉은색·오렌지 의상 착용", "따뜻한 음식이나 미온수를 소량 자주 섭취하세요", "활동량을 늘리거나 밝고 채광이 좋은 공간에 머무르세요", "위축되기 쉬운 날이니 자신감 있는 표현을 의식해보세요"],
    목: ["목(木) 기운으로 균형 — 초록색·청색 의상 착용", "과도한 정체나 생각의 정체를 깨고 몸을 움직이세요", "새로운 계획을 구상하거나 가벼운 산책으로 기운을 뚫어주세요", "소화기계 부담을 줄이도록 가볍게 식사하세요"],
    금: ["금(金) 기운으로 균형 — 흰색·실버 의상 착용", "맺고 끊음을 명확히 하고 주변 환경을 미니멀하게 정돈하세요", "감정적 과잉을 가라앉히고 객관적인 사실에 집중해보세요", "가벼운 스트레칭으로 신체 긴장을 이완하세요"],
    토: ["토(土) 기운으로 균형 — 노란색·브라운·베이지 의상 착용", "대립적인 기운을 중재하고 완충할 수 있는 유연성을 유지하세요", "완벽주의적 강박에서 벗어나 마음의 중심을 잡으세요", "주변 환경을 차분하고 아늑하게 조성하세요"],
  };

  const solution = [...yongsinSolutions[yongsinEl]];

  // 계절 특이사항 코멘트 추가
  if (isSummer && topElement === "화") solution.unshift("여름 극열 — 서늘한 환경 유지가 특히 중요해요");
  if (isSummer && topElement === "금") solution.unshift("여름 조열 — 메마른 환경이므로 수분 공급과 휴식이 최우선입니다");
  if (isWinter && topElement === "수") solution.unshift("겨울 극한 — 체온 유지와 활발한 움직임이 필요해요");
  if (isSpring && topElement === "목") solution.unshift("봄 풍습 — 몸이 무겁고 습해지기 쉬운 시기예요");
  if (isAutumn && topElement === "금") solution.unshift("가을 건조 — 기운이 날카로우니 언행의 포용력을 의식하세요");
  if (isChange && topElement === "토") solution.unshift("환절기 토중 — 기운 정체가 가장 심한 시기예요");

  return {
    status: status as "극열" | "극한" | "풍습" | "조조" | "토중",  // ← status 변수 사용
    label,
    yongsin: yongsinName[yongsinEl],
    yongsinEl,
    solution,
    colors: elementColorMap[yongsinEl],
    direction: elementDirectionMap[yongsinEl],
  };
};

// ── 지지 합충형 ──
const getJijiRelation = (dayJi: string, targetJi: string) => {
  const liuHe: Record<string, string> = {
    자: "축", 축: "자", 인: "해", 해: "인",
    묘: "술", 술: "묘", 진: "유", 유: "진",
    사: "신", 신: "사", 오: "미", 미: "오",
  };
  const chong: Record<string, string> = {
    자: "오", 오: "자", 축: "미", 미: "축",
    인: "신", 신: "인", 묘: "유", 유: "묘",
    진: "술", 술: "진", 사: "해", 해: "사",
  };
  const sanHe: Record<string, string[]> = {
    신: ["자", "진"], 자: ["신", "진"], 진: ["신", "자"],
    인: ["오", "술"], 오: ["인", "술"], 술: ["인", "오"],
    해: ["묘", "미"], 묘: ["해", "미"], 미: ["해", "묘"],
    사: ["유", "축"], 유: ["사", "축"], 축: ["사", "유"],
  };
  const xing: Record<string, string> = {
    인: "사", 사: "신", 신: "인",
    축: "술", 술: "미", 미: "축",
    자: "묘", 묘: "자",
  };

  if (liuHe[dayJi] === targetJi) return { type: "육합 ✨", desc: "지지가 합을 이뤄 조화롭고 안정적인 에너지예요." };
  if (chong[dayJi] === targetJi) return { type: "충 ⚡", desc: "지지가 충돌해 변화와 긴장이 생기는 날이에요. 무리한 결정은 피하세요." };
  if (sanHe[dayJi]?.includes(targetJi)) return { type: "삼합 🌟", desc: "지지가 삼합을 이뤄 강한 시너지 에너지예요." };
  if (xing[dayJi] === targetJi) return { type: "형 ⚠️", desc: "지지가 형을 이뤄 갈등과 마찰이 생길 수 있어요. 인간관계에 주의하세요." };
  return null;
};

// ── 지지 추출 ──
const pillarToJi = (pillar: string) => pillar[1] || "";

// ── 십신 계산 ──
const getTenGod = (dayGan: string, targetGan: string): string => {
  const dayEl = ganToElement[dayGan];
  const targetEl = ganToElement[targetGan];
  const dayYin = ["을", "정", "기", "신", "계"].includes(dayGan);
  const targetYin = ["을", "정", "기", "신", "계"].includes(targetGan);

  if (dayEl === targetEl) return dayYin === targetYin ? "비견" : "겁재";

  const gen: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  const con: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };

  if (gen[dayEl] === targetEl) return dayYin === targetYin ? "식신" : "상관";
  if (gen[targetEl] === dayEl) return dayYin === targetYin ? "편인" : "정인";
  if (con[dayEl] === targetEl) return dayYin === targetYin ? "편재" : "정재";
  if (con[targetEl] === dayEl) return dayYin === targetYin ? "편관" : "정관";
  return "기타";
};

// ── 십신 설명 ──
const tenGodDesc: Record<string, { energy: string; advice: string; caution: string; activity: string }> = {
  비견: { energy: "자신감·독립심이 강해지는 날", advice: "일간과 같은 오행이 만나 본연의 기운이 강해져요. 주도적으로 나서고 새로운 프로젝트를 시작하기에 좋은 에너지예요. 평소보다 결단력이 올라와 중요한 선택을 하기에 유리해요.", caution: "고집이 세지고 타인 의견을 흘려듣기 쉬워요. 협업 상황에서 독단적으로 흐를 수 있으니 한 번 더 주변 목소리를 들어보세요.", activity: "외부 활동·운동 에너지가 좋아요. 수영이나 등산 같은 본인 취미 활동 하기에 좋은 날이에요." },
  겁재: { energy: "경쟁심·추진력이 강해지는 날", advice: "빠른 결단과 실행력이 살아나요. 협업보다 단독 작업에서 강점이 나와요. 경쟁적인 상황에서 유리하게 작용할 수 있어요.", caution: "충동적 지출이나 즉흥적 결정을 조심하세요. 승부욕이 과해지면 인간관계에서 갈등이 생길 수 있어요.", activity: "활동적인 외부 일정이 잘 맞아요. 새로운 사람을 만나거나 네트워킹하기 좋은 날이에요." },
  식신: { energy: "창작·표현·여유의 기운이 강한 날", advice: "머릿속 아이디어가 자연스럽게 흘러나오는 날이에요. 글쓰기·코딩·디자인 등 무언가를 만들어내는 창작 활동에 집중력이 최고조로 올라와요.", caution: "여유로움이 지나쳐 게으름으로 이어질 수 있어요. 적당한 긴장감을 유지하고 하루 하나만이라도 실행에 옮기는 게 중요해요.", activity: "실내 창작 활동이 딱 맞아요. 피아노 치거나 책 읽기 좋고, 가벼운 산책 정도는 기분 전환에 좋아요." },
  상관: { energy: "표현욕·반항심이 강해지는 날", advice: "말과 글로 표현하는 것에 탁월해지는 날이에요. 발표·강의·소통이 필요한 자리에서 빛을 발해요. 틀을 깨는 창의적 아이디어가 나오기 쉬운 날이기도 해요.", caution: "비판적 성향이 강해지고 날이 선 말이 나올 수 있어요. 중요한 대화에서는 말의 온도를 낮추고 감정 조절에 신경 쓰세요.", activity: "소통이 많은 외부 활동이 잘 맞아요. 강의·발표·미팅 등 사람들 앞에 서는 일정에 좋은 날이에요." },
  편재: { energy: "활동·재물·외부 에너지가 강한 날", advice: "적극적으로 나서고 움직이기 좋아요. 영업·네트워킹·외부 미팅에 좋은 에너지예요. 재성이 활성화되는 날이라 수익과 연결된 활동을 추진하기에 유리해요.", caution: "충동적 지출과 과도한 낙관이 생길 수 있어요. 큰 투자나 지출 결정은 한 번 더 검토하고 신중하게 진행하세요.", activity: "외부 활동·사람 만나기 최고의 날이에요. 오전에 중요한 약속을 잡으면 좋아요." },
  정재: { energy: "성실·안정·재물의 기운이 강한 날", advice: "꼼꼼하고 성실하게 일을 처리하기 좋아요. 계획적인 저축·지출 관리 등 재무 관련 일에 집중하기 좋은 날이에요.", caution: "너무 보수적이 되거나 변화를 두려워할 수 있어요. 안정을 추구하되 새로운 시도도 조금은 열어두세요.", activity: "실내에서 차분하게 집중하는 날이에요. 루틴을 지키고 정해진 계획대로 움직이는 게 좋아요." },
  편관: { energy: "도전·극복·강한 자극의 기운이 강한 날", advice: "어려운 과제를 돌파하고 강한 의지력이 살아나는 날이에요. 평소 미뤄왔던 힘든 일을 오늘 밀고 나가면 생각보다 잘 돼요.", caution: "스트레스와 긴장감이 높아질 수 있어요. 몸에 무리가 가지 않도록 적절한 휴식을 챙기세요.", activity: "강도 높은 운동이나 도전적 활동이 잘 맞아요. 등산·수영·격한 운동에서 좋은 에너지가 나와요." },
  정관: { energy: "질서·책임감·명예의 기운이 강한 날", advice: "원칙대로 일을 처리하고 책임감이 강해지는 날이에요. 공식적인 자리·면접·발표에서 신뢰감 있는 인상을 줄 수 있어요.", caution: "지나치게 경직되거나 융통성이 없어질 수 있어요. 원칙 안에서도 유연함을 잃지 마세요.", activity: "공식적인 외부 일정이 잘 맞아요. 이력서 제출이나 취업 활동을 하기에 좋은 날이에요." },
  편인: { energy: "학습·직관·독창성이 강한 날", advice: "혼자 공부하거나 새로운 것을 배우기 좋아요. 직관이 날카로워지고 남들이 보지 못하는 것을 보는 통찰력이 올라와요.", caution: "고립되거나 혼자만의 세계에 빠지기 쉬워요. 적당한 사람 교류로 현실 감각을 유지하세요.", activity: "실내 학습·연구·명상이 잘 맞아요. 새로운 기술이나 언어를 공부하기 좋은 날이에요." },
  정인: { energy: "학습·휴식·내면 정리의 기운이 강한 날", advice: "차분하게 공부하거나 생각을 정리하기 좋아요. 몸과 마음을 충전하는 날로 쓰기에 딱 맞아요.", caution: "너무 수동적이 되거나 의존적이 될 수 있어요. 작은 행동이라도 직접 실천하는 습관을 유지하세요.", activity: "여유로운 실내 활동이 잘 맞아요. 피아노 치거나 책 읽기 딱 좋고, 외출은 가벼운 산책 정도가 어울려요." },
};

// ── 조후 카드 배경색 ──
const johuBg: Record<string, string> = {
  극열: "rgba(216,90,48,0.1)",
  극한: "rgba(24,95,165,0.1)",
  풍습: "rgba(59,109,17,0.1)",
  조조: "rgba(186,117,23,0.1)",
  토중: "rgba(136,135,128,0.1)",
  평이: "rgba(108,99,255,0.05)",
  냉금: "rgba(24,95,165,0.1)",
};

const johuBorder: Record<string, string> = {
  극열: "rgba(216,90,48,0.3)",
  극한: "rgba(24,95,165,0.3)",
  풍습: "rgba(59,109,17,0.3)",
  조조: "rgba(186,117,23,0.3)",
  토중: "rgba(136,135,128,0.3)",
  평이: "rgba(108,99,255,0.2)",
  냉금: "rgba(24,95,165,0.3)",
};

const johuTextColor: Record<string, string> = {
  극열: "#D85A30", 극한: "#185FA5", 풍습: "#3B6D11",
  조조: "#BA7517", 토중: "#888780", 평이: "#6c63ff",
  냉금: "#185FA5",
};

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [birth, setBirth] = useState<BirthInfo>({
    year: "", month: "", day: "", hour: "", minute: "",
    name: "", unknownHour: false, isLunar: false,
  });
  const [targetDate, setTargetDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"fortune" | "birth">("fortune");

  useEffect(() => {
    const savedBirth = localStorage.getItem("birth-info");
    if (savedBirth) { setBirth(JSON.parse(savedBirth)); setSaved(true); }
  }, []);

  const saveBirth = () => {
    localStorage.setItem("birth-info", JSON.stringify(birth));
    setSaved(true);
    setActiveTab("fortune");
  };

  const analyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthYear: birth.year, birthMonth: birth.month, birthDay: birth.day,
          birthHour: birth.hour, unknownHour: birth.unknownHour,
          isLunar: birth.isLunar, targetDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "분석 중 오류가 발생했어요."); return; }

      const dayGan = data.saju.day[0];
      const dayJi = pillarToJi(data.saju.day);
      const dayPillarGan = data.dayPillar[0];
      const dayPillarJi = pillarToJi(data.dayPillar);

      const tenGod = getTenGod(dayGan, dayPillarGan);
      const jijiRelation = getJijiRelation(dayJi, dayPillarJi);
      const desc = tenGodDesc[tenGod] || tenGodDesc["비견"];
      const elementResult = calcElementScore(data.saju, data.dayPillar, data.monthPillar);
      const johu = getJohu(data.monthPillar, data.dayPillar, elementResult.scores, elementResult.total);
      const strengthResult = calcStrength(data.saju, data.dayPillar, data.monthPillar);
      const geokkukResult = calcGeokkuk(data.saju, data.dayPillar, data.monthPillar);
      const yongsinResult = calcYongsin(strengthResult, geokkukResult, data.dayPillar, data.monthPillar);

      const colorInfo = getColors(
        data.saju.day,
        strengthResult,
        johu,
        data.dayPillar,
        yongsinResult,  // 억부용신 추가
      );

      const tripleText = elementResult.tripleChar
        ? `⚠️ 지지 삼중첩(${elementResult.tripleChar}${elementResult.tripleChar}${elementResult.tripleChar}) 감지 — 해당 오행이 극도로 강해져 편중된 에너지가 작용해요. 오늘은 특히 균형에 주의하세요.`
        : null;

      setResult({
        ...data,
        analysis: {
          tenGod, jijiRelation,
          energy: desc.energy,
          colors: colorInfo.colors,
          direction: colorInfo.direction,
          colorBasis: colorInfo.basis,
          advice: desc.advice,
          caution: desc.caution,
          activity: desc.activity,
          elementScore: elementResult,
          tripleText,
          johu,
          strength: strengthResult,
          geokkuk: geokkukResult,
          yongsin: yongsinResult,
        },
      });
    } catch { alert("분석 중 오류가 발생했어요."); }
    finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--input-bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 15,
    width: "100%",
    fontFamily: "inherit",
    WebkitAppearance: "none",
    appearance: "none",
    boxSizing: "border-box",
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "Pretendard, -apple-system, sans-serif" }}>

      {/* 헤더 */}
      <div style={{ padding: "2px 20px 0", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>🌙 만세력 운세</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 2 }}>사주 기반 일일 운세 분석</p>
            <p style={{ fontSize: 11, color: "var(--caution)", marginBottom: 20 }}>사주는 통계적 경향성일 뿐, 하루를 결정하는 것은 당신의 선택입니다.</p>
          </div>
          {mounted && (
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{ position: "relative", width: 48, height: 26, borderRadius: 999, background: theme === "dark" ? "#6c63ff" : "#ccc", border: "none", cursor: "pointer", transition: "background 0.3s", flexShrink: 0, marginTop: 4 }}>
              <div style={{ position: "absolute", top: 3, left: theme === "dark" ? 25 : 3, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
            </button>
          )}
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "var(--bg2)", borderRadius: 10, padding: 4 }}>
          {[["fortune", "운세 보기"], ["birth", "내 정보"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", background: activeTab === tab ? "#6c63ff" : "transparent", color: activeTab === tab ? "white" : "var(--muted)", transition: "all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 40px" }}>

        {/* ── 내 정보 탭 ── */}
        {activeTab === "birth" && (
          <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 20, overflow: "hidden" }}>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>생년월일시를 입력하면 자동으로 사주를 계산해요.</p>

            <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>이름 (선택)</label>
            <input value={birth.name} onChange={(e) => setBirth({ ...birth, name: e.target.value })}
              placeholder="이름 입력" style={{ ...inputStyle, marginBottom: 14 }} />

            {/* 양력/음력 */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "var(--bg)", borderRadius: 8, padding: 4 }}>
              {[["solar", "양력"], ["lunar", "음력"]].map(([val, label]) => (
                <button key={val} onClick={() => setBirth({ ...birth, isLunar: val === "lunar" })}
                  style={{ flex: 1, padding: "8px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", background: (val === "lunar") === birth.isLunar ? "var(--accent)" : "transparent", color: (val === "lunar") === birth.isLunar ? "white" : "var(--muted)", transition: "all 0.2s" }}>
                  {label}
                </button>
              ))}
            </div>

            {birth.isLunar && (
              <div style={{ background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--accent)", marginBottom: 14, lineHeight: 1.6 }}>
                💡 음력 변환이 안 될 경우{" "}
                <a href="https://search.naver.com/search.naver?query=음양력변환" target="_blank" style={{ color: "var(--accent2)" }}>
                  네이버 음양력변환 →
                </a>
                {" "}에서 양력으로 변환 후 입력해주세요.
              </div>
            )}

            {/* 년월일 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[["년", "year", 1900, 2050], ["월", "month", 1, 12], ["일", "day", 1, 31]].map(([label, key, min, max]) => (
                <div key={key as string}>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>{label}</label>
                  <input type="number" min={min as number} max={max as number}
                    value={birth[key as keyof BirthInfo] as any}
                    onChange={(e) => setBirth({ ...birth, [key as string]: e.target.value === "" ? "" : Number(e.target.value) })}
                    style={inputStyle} />
                </div>
              ))}
            </div>

            {/* 시간 모름 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <input type="checkbox" id="unknownHour" checked={birth.unknownHour}
                onChange={(e) => setBirth({ ...birth, unknownHour: e.target.checked })}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#6c63ff" }} />
              <label htmlFor="unknownHour" style={{ fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>
                태어난 시간을 모릅니다
              </label>
            </div>

            {/* 시/분 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {[["시 (0~23)", "hour", 0, 23], ["분", "minute", 0, 59]].map(([label, key, min, max]) => (
                <div key={key as string}>
                  <label style={{ fontSize: 12, color: birth.unknownHour ? "var(--border)" : "var(--muted)", display: "block", marginBottom: 6 }}>{label}</label>
                  <input type="number" min={min as number} max={max as number}
                    value={birth[key as keyof BirthInfo] as any}
                    onChange={(e) => setBirth({ ...birth, [key as string]: e.target.value === "" ? "" : Number(e.target.value) })}
                    disabled={birth.unknownHour}
                    style={{ ...inputStyle, opacity: birth.unknownHour ? 0.4 : 1, cursor: birth.unknownHour ? "not-allowed" : "text" }} />
                </div>
              ))}
            </div>

            <button onClick={saveBirth}
              style={{ width: "100%", padding: "14px", background: "#6c63ff", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              저장하고 운세 보기
            </button>
          </div>
        )}

        {/* ── 운세 탭 ── */}
        {activeTab === "fortune" && (
          <div>
            {!saved && (
              <div style={{ background: "#1a1a2e", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#a0a0ff", marginBottom: 10 }}>먼저 내 정보를 입력해주세요 😊</p>
                <button onClick={() => setActiveTab("birth")}
                  style={{ padding: "8px 20px", background: "#6c63ff", color: "white", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  내 정보 입력하기
                </button>
              </div>
            )}

            {/* 날짜 선택 */}
            <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 8 }}>운세 날짜 선택</label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                style={{ ...inputStyle, marginBottom: 12 }} />
              <button onClick={analyze} disabled={loading || !saved}
                style={{ width: "100%", padding: "14px", background: loading || !saved ? "#3a3a5c" : "#6c63ff", color: loading || !saved ? "var(--muted)" : "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading || !saved ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.2s" }}>
                {loading ? "분석 중..." : "🔮 운세 분석하기"}
              </button>
            </div>

            {/* ── 결과 ── */}
            {result && (
              <div>
                {/* 일진·사주 원국 */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: "#6c63ff", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 오늘 일진</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[["세운", result.yearPillar], ["월건", result.monthPillar], ["일진", result.dayPillar]].map(([label, value]) => (
                      <div key={label} style={{ background: "var(--card)", borderRadius: 8, padding: "12px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#00d4aa" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  {result.isLunar && result.convertedSolar && (
                    <div style={{ fontSize: 12, color: "var(--accent2)", marginBottom: 10 }}>
                      음력 → 양력 변환: {result.convertedSolar.year}년 {result.convertedSolar.month}월 {result.convertedSolar.day}일
                    </div>
                  )}
                  <p style={{ fontSize: 11, color: "#6c63ff", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>// 사주 원국</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                    {[["시", result.saju.hour], ["일", result.saju.day], ["월", result.saju.month], ["년", result.saju.year]].map(([label, value]) => (
                      <div key={label} style={{ background: "var(--card2)", borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: value === "-" ? "var(--muted)" : "var(--text)" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 오행 점수 */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 오행 점수</p>
                  {Object.entries(result.analysis.elementScore.scores).map(([el, score]) => {
                    const pct = result.analysis.elementScore.percentage[el];
                    const elColor: Record<string, string> = {
                      목: "#3B6D11", 화: "#D85A30", 토: "#BA7517", 금: "#888780", 수: "#185FA5"
                    };
                    const isDominant = result.analysis.elementScore.dominant === el;
                    const isYongsin = result.analysis.yongsin?.yongsinEl === el;
                    const isHeesin = result.analysis.yongsin?.heesinEl === el;
                    const isGisin = result.analysis.yongsin?.gisinEl === el;
                    const isGusin = result.analysis.yongsin?.gusinEl === el;

                    const tag = isYongsin ? "용신 💎"
                      : isHeesin ? "희신 ✨"
                      : isGisin ? "기신 ⚠️"
                      : isGusin ? "구신 🔻"
                      : isDominant ? "과다 ⚡"
                      : "";

                    const tagColor = isYongsin ? "#00d4aa"
                      : isHeesin ? "#a78bfa"
                      : isGisin ? "#ff6b6b"
                      : isGusin ? "#f59e0b"
                      : isDominant ? "#ff6b6b"
                      : "var(--muted)";

                    return (
                      <div key={el} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: "var(--text)", fontWeight: tag ? 700 : 400 }}>{el}</span>
                            {tag && (
                              <span style={{ fontSize: 10, color: tagColor, background: `${tagColor}20`, padding: "1px 6px", borderRadius: 10 }}>
                                {tag}
                              </span>
                            )}
                          </div>
                          <span style={{ color: "var(--muted)" }}>{score}점 ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, background: "var(--card)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: elColor[el], borderRadius: 3, transition: "width 0.5s", opacity: isGisin || isGusin ? 0.5 : 1 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 조후 판단 */}
                <div style={{ background: johuBg[result.analysis.johu.status], border: `1px solid ${johuBorder[result.analysis.johu.status]}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: johuTextColor[result.analysis.johu.status], letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                    // 조후 판단 — {result.analysis.johu.label}
                  </p>
                  {result.analysis.johu.yongsin && (
                    <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 10 }}>
                      용신: <strong style={{ fontWeight: 700 }}>{result.analysis.johu.yongsin}</strong> — 오늘은 {result.analysis.johu.yongsin} 기운으로 균형을 잡아야 해요.
                    </p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {result.analysis.johu.solution.map((s, i) => (
                      <div key={i} style={{ fontSize: 13, color: "var(--muted)", display: "flex", gap: 8 }}>
                        <span>•</span><span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 지지 합충형 */}
                {result.analysis.jijiRelation && (
                  <div style={{ background: "var(--card)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--accent2)", marginBottom: 4 }}>
                      지지 관계 — {result.analysis.jijiRelation.type}
                    </div>
                    <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>
                      {result.analysis.jijiRelation.desc}
                    </div>
                  </div>
                )}

                {/* 십신 분석 */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ background: "#6c63ff", color: "white", borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>
                      {result.analysis.tenGod}
                    </div>
                    <div style={{ fontSize: 14, color: "var(--muted)" }}>{result.analysis.energy}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { color: "#00d4aa", icon: "✦ 좋은 흐름", text: result.analysis.advice },
                      { color: "#f59e0b", icon: "⚠ 주의사항", text: result.analysis.caution },
                      { color: "#a78bfa", icon: "🏃 외부활동", text: result.analysis.activity },
                    ].map((item) => (
                      <div key={item.icon} style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, color: item.color, marginBottom: 6 }}>{item.icon}</div>
                        <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{item.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 신강/신약 */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 신강·신약 판단</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{
                      padding: "6px 16px", borderRadius: 20, fontWeight: 700, fontSize: 15,
                      background: result.analysis.strength.strength === "신강"
                        ? "rgba(216,90,48,0.15)"
                        : result.analysis.strength.strength === "신약"
                        ? "rgba(24,95,165,0.15)"
                        : "rgba(108,99,255,0.15)",
                      color: result.analysis.strength.strength === "신강"
                        ? "#D85A30"
                        : result.analysis.strength.strength === "신약"
                        ? "#185FA5"
                        : "#6c63ff",
                      border: `1px solid ${result.analysis.strength.strength === "신강"
                        ? "rgba(216,90,48,0.3)"
                        : result.analysis.strength.strength === "신약"
                        ? "rgba(24,95,165,0.3)"
                        : "rgba(108,99,255,0.3)"}`,
                    }}>
                      {result.analysis.strength.strength}
                    </div>
                    {/* 강약 게이지 */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
                        <span>신약</span>
                        <span>중화</span>
                        <span>신강</span>
                      </div>
                      <div style={{ height: 8, background: "var(--card)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                        <div style={{
                          height: "100%",
                          width: `${result.analysis.strength.score}%`,
                          background: result.analysis.strength.strength === "신강"
                            ? "linear-gradient(90deg, #6c63ff, #D85A30)"
                            : result.analysis.strength.strength === "신약"
                            ? "linear-gradient(90deg, #185FA5, #6c63ff)"
                            : "linear-gradient(90deg, #6c63ff, #00d4aa)",
                          borderRadius: 4,
                          transition: "width 0.5s",
                        }} />
                        {/* 중화 기준선 */}
                        <div style={{ position: "absolute", top: 0, left: "50%", width: 2, height: "100%", background: "rgba(255,255,255,0.3)" }} />
                      </div>
                      <div style={{ textAlign: "right", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        {result.analysis.strength.score}점
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>
                    {result.analysis.strength.desc}
                  </p>
                </div>
                
                {/* 격국 판단 */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 격국 판단</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.3)", color: "#00d4aa", borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>
                      {result.analysis.geokkuk.name}
                    </div>
                  </div>
                  <div style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: "var(--accent2)", marginBottom: 6 }}>✦ 격국 특성</div>
                    <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{result.analysis.geokkuk.desc}</div>
                  </div>
                  <div style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#a78bfa", marginBottom: 6 }}>💎 격국 용신</div>
                    <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>
                      <strong style={{ fontWeight: 700 }}>{result.analysis.geokkuk.yongsin}</strong>
                    </div>
                  </div>
                </div> 
                
                {/* 억부용신 */}
                {result.analysis.yongsin && (
                  <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 억부용신</p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <div style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#00d4aa", marginBottom: 4 }}>용신 💎</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#00d4aa" }}>{result.analysis.yongsin.yongsin}</div>
                      </div>
                      <div style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#a78bfa", marginBottom: 4 }}>희신 ✨</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#a78bfa" }}>{result.analysis.yongsin.heesin}</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                      <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#ff6b6b", marginBottom: 4 }}>기신 ⚠️</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#ff6b6b" }}>{result.analysis.yongsin.gisин}</div>
                      </div>
                      <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 4 }}>구신 🔻</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{result.analysis.yongsin.gusin}</div>
                      </div>
                      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>한신 ➖</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>{result.analysis.yongsin.hansin}</div>
                      </div>
                    </div>

                    <div style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, color: "var(--accent2)", marginBottom: 6 }}>✦ 용신 해설</div>
                      <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{result.analysis.yongsin.desc}</div>
                    </div>
                  </div>
                )}
                
                {/* 추천 색상 */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: "#6c63ff", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>// 오늘 추천 색상</p>
                    <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--card)", padding: "3px 8px", borderRadius: 10 }}>
                      {result.analysis.colorBasis}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {result.analysis.colors.map((c) => (
                      <div key={c.name} style={{ background: "var(--card)", borderRadius: 8, padding: "12px 8px", textAlign: "center", border: "1px solid var(--border)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: c.hex, margin: "0 auto 8px", border: "2px solid rgba(0,0,0,0.1)", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }} />
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 길한 방향 */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16 }}>
                  <p style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 길한 방향</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 28 }}>🧭</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent2)" }}>{result.analysis.direction}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}