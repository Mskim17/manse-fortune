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
      status: "극열" | "극한" | "평이" | "풍습" | "조조" | "토중";
      label: string;
      yongsin: string;
      solution: string[];
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

// ── 추천 색상·방향 계산 (조후 용신 우선) ──
const getColors = (dayPillar: string, johuYongsin?: string) => {
  // 조후 용신이 있으면 용신 오행 기준
  let el = ganToElement[dayPillar[0]];

  if (johuYongsin) {
    if (johuYongsin.includes("수")) el = "수";
    else if (johuYongsin.includes("화")) el = "화";
    else if (johuYongsin.includes("목")) el = "목";
    else if (johuYongsin.includes("금")) el = "금";
    else if (johuYongsin.includes("토")) el = "토";
  }

  return {
    colors: elementColorCodes[el] || elementColorCodes["금"],
    direction: elementDirection[el] || "중앙",
    element: el,
  };
};

// ── 다자 경고 ──
const dominantWarning: Record<string, string> = {
  목: "🌳 목(木) 과다 — 고집과 완고함이 강해져 타인과 마찰이 생기기 쉬워요. 유연함을 의식적으로 유지하고, 금(金) 기운의 흰색·회색 의상으로 균형을 잡으세요.",
  화: "🔥 화(火) 과다 — 조급증과 체력 방전이 올 수 있어요. 충동적 결정을 삼가고 충분한 수분 보충과 휴식이 필요해요. 수(水) 기운의 검은색·네이비 의상을 추천해요.",
  토: "🌍 토(土) 과다 — 과도한 걱정과 소화 계통 문제가 생길 수 있어요. 생각을 단순화하고 목(木) 기운의 초록색으로 토를 극해 균형을 잡으세요.",
  금: "⚙️ 금(金) 과다 — 지나친 완벽주의와 냉정함으로 인간관계가 경직될 수 있어요. 화(火) 기운의 붉은색으로 금을 녹여 유연함을 더하세요.",
  수: "💧 수(水) 과다 — 실행력 저하와 우유부단함이 나타날 수 있어요. 생각만 하고 행동이 없는 날이에요. 토(土) 기운의 노란색·베이지로 수를 억제하고 실행에 집중하세요.",
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

  const fireRatio = scores.화 / total;
  const waterRatio = scores.수 / total;
  const woodRatio = scores.목 / total;
  const earthRatio = scores.토 / total;
  const goldRatio = scores.금 / total;

  if (summerJi.includes(monthJi) && fireRatio >= 0.35) {
    return {
      status: "극열" as const,
      label: "極熱 (극열) 🔥",
      yongsin: "수(水)",
      solution: [
        "검은색·네이비·딥블루 의상 착용",
        "수분 충분히 보충 (물·음료 자주)",
        "직사광선 피하고 서늘한 환경 유지",
        "격한 활동보다 차분한 활동 권장",
      ],
    };
  }
  if (winterJi.includes(monthJi) && waterRatio >= 0.35) {
    return {
      status: "극한" as const,
      label: "極寒 (극한) ❄️",
      yongsin: "화(火)",
      solution: [
        "붉은색·오렌지·버건디 의상 착용",
        "따뜻한 음식·음료 섭취",
        "활발한 움직임으로 체온 유지",
        "햇볕 쬐기, 밝고 따뜻한 공간 활용",
      ],
    };
  }
  if (springJi.includes(monthJi) && woodRatio >= 0.35) {
    return {
      status: "풍습" as const,
      label: "風濕 (풍습) 🌿",
      yongsin: "금(金)",
      solution: [
        "흰색·회색 의상으로 과도한 목 기운을 제어하세요.",
        "생각이 너무 뻗어나가 행동이 굼떠질 수 있으니 과감한 실행력이 필요해요.",
        "몸이 무겁거나 습해지기 쉬우니 가벼운 스트레칭을 자주 해주세요.",
      ],
    };
  }
  if (autumnJi.includes(monthJi) && goldRatio >= 0.35) {
    return {
      status: "조조" as const,
      label: "燥熱 (조조) 🍂",
      yongsin: "화(火)",
      solution: [
        "붉은색·오렌지색 의상으로 경직된 기운을 부드럽게 녹이세요.",
        "기운이 건조하고 냉정해져 주변 사람에게 날카로운 말을 건네기 쉬워요.",
        "타인에 대한 포용력을 의식적으로 발휘하고, 호흡기 건강에 신경 쓰세요.",
      ],
    };
  }
  if (changeJi.includes(monthJi) && earthRatio >= 0.35) {
    return {
      status: "토중" as const,
      label: "土重 (토중) 🌍",
      yongsin: "목(木)",
      solution: [
        "초록색·청색 의상으로 정체된 기운을 뚫어주세요.",
        "토 기운이 뭉치면 과도한 걱정과 소화 불량이 생기기 쉬워요.",
        "묵은 일들을 정리하거나 불필요한 물건을 비우는 활동이 개운에 좋아요.",
      ],
    };
  }
  return {
    status: "평이" as const,
    label: "균형 ☯️",
    yongsin: "",
    solution: [
      "조후가 안정적이니 원하시는 활동을 자유롭게 진행하셔도 좋아요.",
    ],
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
};

const johuBorder: Record<string, string> = {
  극열: "rgba(216,90,48,0.3)",
  극한: "rgba(24,95,165,0.3)",
  풍습: "rgba(59,109,17,0.3)",
  조조: "rgba(186,117,23,0.3)",
  토중: "rgba(136,135,128,0.3)",
  평이: "rgba(108,99,255,0.2)",
};

const johuTextColor: Record<string, string> = {
  극열: "#D85A30", 극한: "#185FA5", 풍습: "#3B6D11",
  조조: "#BA7517", 토중: "#888780", 평이: "#6c63ff",
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

      // 조후 용신이 있으면 용신 기준 색상·방향, 없으면 일진 기준
      const colorInfo = getColors(
        data.dayPillar,
        johu.status !== "평이" ? johu.yongsin : undefined
      );

      const dominantText = elementResult.dominant ? dominantWarning[elementResult.dominant] || null : null;
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
          advice: desc.advice,
          caution: desc.caution,
          activity: desc.activity,
          elementScore: elementResult,
          dominantText,
          tripleText,
          johu,
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
            <p style={{ fontSize: 11, color: "var(--caution)", marginBottom: 20 }}>분석은 통계적 경향성일 뿐, 하루를 결정하는 것은 당신의 선택입니다.</p>
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
                    const elColor: Record<string, string> = { 목: "#3B6D11", 화: "#D85A30", 토: "#BA7517", 금: "#888780", 수: "#185FA5" };
                    const isDominant = result.analysis.elementScore.dominant === el;
                    return (
                      <div key={el} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: isDominant ? elColor[el] : "var(--text)", fontWeight: isDominant ? 700 : 400 }}>
                            {el} {isDominant ? "⚠️ 과다" : ""}
                          </span>
                          <span style={{ color: "var(--muted)" }}>{score}점 ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, background: "var(--card)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: elColor[el], borderRadius: 3, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 다자 경고 */}
                {(result.analysis.dominantText || result.analysis.tripleText) && (
                  <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: "#ff6b6b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>// 오행 과다 경고</p>
                    {result.analysis.dominantText && (
                      <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7, marginBottom: result.analysis.tripleText ? 8 : 0 }}>
                        {result.analysis.dominantText}
                      </p>
                    )}
                    {result.analysis.tripleText && (
                      <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{result.analysis.tripleText}</p>
                    )}
                  </div>
                )}

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

                {/* 추천 색상 */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: "#6c63ff", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>// 오늘 추천 색상</p>
                  {result.analysis.johu.status !== "평이" && (
                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                      조후 용신({result.analysis.johu.yongsin}) 기준으로 조정됐어요.
                    </p>
                  )}
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
                  {result.analysis.johu.status !== "평이" && (
                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                      조후 용신({result.analysis.johu.yongsin}) 기준으로 조정됐어요.
                    </p>
                  )}
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