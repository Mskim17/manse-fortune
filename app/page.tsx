"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface BirthInfo {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  name: string;
  unknownHour: boolean;
}

interface FortuneResult {
  dayPillar: string;
  monthPillar: string;
  yearPillar: string;
  saju: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  analysis: {
    tenGod: string;
    energy: string;
    colors: { name: string; hex: string; desc: string }[];
    direction: string;
    advice: string;
    caution: string;
    activity: string;
  };
}

// 천간 오행
const ganElement: Record<string, string> = {
  갑: "목", 을: "목", 병: "화", 정: "화", 무: "토",
  기: "토", 경: "금", 신: "금", 임: "수", 계: "수",
};

// 오행별 추천 색상
const elementColors: Record<string, string[]> = {
  목: ["초록", "연두", "청록"],
  화: ["빨강", "주황", "분홍"],
  토: ["노랑", "베이지", "브라운"],
  금: ["흰색", "실버", "회색"],
  수: ["검정", "네이비", "파랑"],
};

// 일간 기준 육친 계산
const getTenGod = (dayGan: string, targetGan: string): string => {
  const dayEl = ganElement[dayGan[0]];
  const targetEl = ganElement[targetGan[0]];
  const dayYin = ["을","정","기","신","계"].includes(dayGan[0]);
  const targetYin = ["을","정","기","신","계"].includes(targetGan[0]);

  if (dayEl === targetEl) return dayYin === targetYin ? "비견" : "겁재";

  const generates: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
  const controls: Record<string, string> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };

  if (generates[dayEl] === targetEl) return dayYin === targetYin ? "식신" : "상관";
  if (generates[targetEl] === dayEl) return dayYin === targetYin ? "편인" : "정인";
  if (controls[dayEl] === targetEl) return dayYin === targetYin ? "편재" : "정재";
  if (controls[targetEl] === dayEl) return dayYin === targetYin ? "편관" : "정관";
  return "기타";
};

// 육친별 성향 설명
const tenGodDesc: Record<string, { energy: string; advice: string; caution: string; activity: string }> = {
  비견: {
    energy: "자신감·독립심이 강해지는 날",
    advice: "일간과 같은 오행이 만나 본연의 기운이 강해져요. 주도적으로 나서고 새로운 프로젝트를 시작하기에 좋은 에너지예요. 평소보다 결단력이 올라와 중요한 선택을 하기에 유리해요.",
    caution: "고집이 세지고 타인 의견을 흘려듣기 쉬워요. 협업 상황에서 독단적으로 흐를 수 있으니 한 번 더 주변 목소리를 들어보세요.",
    activity: "외부 활동·운동 에너지가 좋아요. 수영이나 등산 같은 본인 취미 활동 하기에 좋은 날이에요."
  },
  겁재: {
    energy: "경쟁심·추진력이 강해지는 날",
    advice: "빠른 결단과 실행력이 살아나요. 협업보다 단독 작업에서 강점이 나와요. 경쟁적인 상황에서 유리하게 작용할 수 있어요.",
    caution: "충동적 지출이나 즉흥적 결정을 조심하세요. 승부욕이 과해지면 인간관계에서 갈등이 생길 수 있어요.",
    activity: "활동적인 외부 일정이 잘 맞아요. 새로운 사람을 만나거나 네트워킹하기 좋은 날이에요."
  },
  식신: {
    energy: "창작·표현·여유의 기운이 강한 날",
    advice: "머릿속 아이디어가 자연스럽게 흘러나오는 날이에요. 글쓰기·코딩·디자인 등 무언가를 만들어내는 창작 활동에 집중력이 최고조로 올라와요. 새 프로젝트 첫 삽 뜨기에 올해 손꼽히는 좋은 날 중 하나예요.",
    caution: "여유로움이 지나쳐 게으름으로 이어질 수 있어요. 적당한 긴장감을 유지하고 하루 하나만이라도 실행에 옮기는 게 중요해요.",
    activity: "실내 창작 활동이 딱 맞아요. 피아노 치거나 책 읽기 좋고, 가벼운 산책 정도는 기분 전환에 좋아요."
  },
  상관: {
    energy: "표현욕·반항심이 강해지는 날",
    advice: "말과 글로 표현하는 것에 탁월해지는 날이에요. 발표·강의·소통이 필요한 자리에서 빛을 발해요. 틀을 깨는 창의적 아이디어가 나오기 쉬운 날이기도 해요.",
    caution: "비판적 성향이 강해지고 날이 선 말이 나올 수 있어요. 중요한 대화에서는 말의 온도를 낮추고 감정 조절에 신경 쓰세요.",
    activity: "소통이 많은 외부 활동이 잘 맞아요. 강의·발표·미팅 등 사람들 앞에 서는 일정에 좋은 날이에요."
  },
  편재: {
    energy: "활동·재물·외부 에너지가 강한 날",
    advice: "적극적으로 나서고 움직이기 좋아요. 영업·네트워킹·외부 미팅에 좋은 에너지예요. 재성이 활성화되는 날이라 수익과 연결된 활동을 추진하기에 유리해요.",
    caution: "충동적 지출과 과도한 낙관이 생길 수 있어요. 큰 투자나 지출 결정은 한 번 더 검토하고 신중하게 진행하세요.",
    activity: "외부 활동·사람 만나기 최고의 날이에요. 오전에 중요한 약속을 잡으면 좋아요."
  },
  정재: {
    energy: "성실·안정·재물의 기운이 강한 날",
    advice: "꼼꼼하고 성실하게 일을 처리하기 좋아요. 계획적인 저축·지출 관리·장부 정리 등 재무 관련 일에 집중하기 좋은 날이에요.",
    caution: "너무 보수적이 되거나 변화를 두려워할 수 있어요. 안정을 추구하되 새로운 시도도 조금은 열어두세요.",
    activity: "실내에서 차분하게 집중하는 날이에요. 루틴을 지키고 정해진 계획대로 움직이는 게 좋아요."
  },
  편관: {
    energy: "도전·극복·강한 자극의 기운이 강한 날",
    advice: "어려운 과제를 돌파하고 강한 의지력이 살아나는 날이에요. 평소 미뤄왔던 힘든 일을 오늘 밀고 나가면 생각보다 잘 돼요.",
    caution: "스트레스와 긴장감이 높아질 수 있어요. 몸에 무리가 가지 않도록 적절한 휴식을 챙기세요.",
    activity: "강도 높은 운동이나 도전적 활동이 잘 맞아요. 등산·수영·격한 운동에서 좋은 에너지가 나와요."
  },
  정관: {
    energy: "질서·책임감·명예의 기운이 강한 날",
    advice: "원칙대로 일을 처리하고 책임감이 강해지는 날이에요. 공식적인 자리·면접·발표에서 신뢰감 있는 인상을 줄 수 있어요.",
    caution: "지나치게 경직되거나 융통성이 없어질 수 있어요. 원칙 안에서도 유연함을 잃지 마세요.",
    activity: "공식적인 외부 일정이 잘 맞아요. 이력서 제출이나 취업 활동을 하기에 좋은 날이에요."
  },
  편인: {
    energy: "학습·직관·독창성이 강한 날",
    advice: "혼자 공부하거나 새로운 것을 배우기 좋아요. 직관이 날카로워지고 남들이 보지 못하는 것을 보는 통찰력이 올라와요.",
    caution: "고립되거나 혼자만의 세계에 빠지기 쉬워요. 적당한 사람 교류로 현실 감각을 유지하세요.",
    activity: "실내 학습·연구·명상이 잘 맞아요. 새로운 기술이나 언어를 공부하기 좋은 날이에요."
  },
  정인: {
    energy: "학습·휴식·내면 정리의 기운이 강한 날",
    advice: "차분하게 공부하거나 생각을 정리하기 좋아요. 몸과 마음을 충전하는 날로 쓰기에 딱 맞아요. 과거에 배웠던 것을 다시 복습하거나 정리하면 새로운 인사이트가 나올 수 있어요.",
    caution: "너무 수동적이 되거나 의존적이 될 수 있어요. 작은 행동이라도 직접 실천하는 습관을 유지하세요.",
    activity: "여유로운 실내 활동이 잘 맞아요. 피아노 치거나 책 읽기 딱 좋고, 외출은 가벼운 산책 정도가 어울려요."
  },
};

// 오행별 길한 방향
const elementDirection: Record<string, string> = {
  목: "동쪽·동남쪽",
  화: "남쪽·동남쪽",
  토: "중앙·남서쪽",
  금: "서쪽·북서쪽",
  수: "북쪽·북서쪽",
};

// 오행별 색상 코드
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
    { name: "다크네이비", hex: "#1a3a5c", desc: "壬水 보강. 포인트" },
  ],
  수: [
    { name: "다크네이비·블랙", hex: "#1a3a5c", desc: "수 기운 강화. 메인" },
    { name: "차콜·다크그레이", hex: "#2D2D2D", desc: "깊이감. 서브" },
    { name: "실버·그레이", hex: "#C0C0C0", desc: "균형. 포인트" },
  ],
};

// 추천 색상 (일진 오행 기준)
const getColors = (dayPillar: string) => {
  const gan = dayPillar[0];
  const el = ganElement[gan];
  return {
    colors: elementColorCodes[el] || elementColorCodes["금"],
    direction: elementDirection[el] || "중앙",
    element: el,
  };
};

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [birth, setBirth] = useState<BirthInfo>({
    year: "" as any, month: "" as any, day: "" as any, hour: "" as any, minute: "" as any, name: "", unknownHour: false
  });
  const [targetDate, setTargetDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const week = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = week[today.getDay()];
    console.log(`${year}-${month}-${date} (${dayOfWeek})`);
    return `${year}-${month}-${date}`;
    // return today.toISOString().split("T")[0];
  });
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"fortune" | "birth">("fortune");

  useEffect(() => {
    const savedBirth = localStorage.getItem("birth-info");
    if (savedBirth) {
      setBirth(JSON.parse(savedBirth));
      setSaved(true);
    }
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
          birthYear: birth.year,
          birthMonth: birth.month,
          birthDay: birth.day,
          birthHour: birth.hour,
          unknownHour: birth.unknownHour,
          targetDate,
        }),
      });
      const data = await res.json();

      // 일간 추출 (일주 첫 글자)
      const dayGan = data.saju.day[0];
      const dayPillarGan = data.dayPillar[0];
      const tenGod = getTenGod(dayGan, dayPillarGan);
      const desc = tenGodDesc[tenGod] || tenGodDesc["비견"];
      const colorInfo = getColors(data.dayPillar);
      
      setResult({
        ...data,
        analysis: {
          tenGod,
          energy: desc.energy,
          colors: colorInfo.colors,
          direction: colorInfo.direction,
          advice: desc.advice,
          caution: desc.caution,
          activity: desc.activity,
        },
      });
    } catch {
      alert("분석 중 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: "var(--input-bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 15,
    width: "100%",
    fontFamily: "inherit",
    WebkitAppearance: "none" as const,  // 추가
    appearance: "none" as const,         // 추가
    boxSizing: "border-box" as const,    // 추가
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "Pretendard, -apple-system, sans-serif" }}>

      {/* 헤더 */}
      <div style={{ padding: "20px 20px 0", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>🌙 만세력 운세</h1>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>사주 기반 일일 운세 분석</p>
          </div>
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              style={{ position: "relative", width: 48, height: 26, borderRadius: 999, background: theme === "dark" ? "#6c63ff" : "#ccc", border: "none", cursor: "pointer", transition: "background 0.3s", flexShrink: 0, marginTop: 4 }}
            >
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

        {/* 내 정보 탭 */}
        {activeTab === "birth" && (
          <div>
            <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 20, marginBottom: 16, overflow: "hidden" }}>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>생년월일시를 입력하면 자동으로 사주를 계산해요.</p>

              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>이름 (선택)</label>
              <input value={birth.name} onChange={(e) => setBirth({ ...birth, name: e.target.value })}
                placeholder="이름 입력" style={{ ...inputStyle, marginBottom: 14 }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>년</label>
                  <input type="number" value={birth.year} onChange={(e) => setBirth({ ...birth, year: Number(e.target.value) })}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>월</label>
                  <input type="number" min={1} max={12} value={birth.month} onChange={(e) => setBirth({ ...birth, month: Number(e.target.value) })}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>일</label>
                  <input type="number" min={1} max={31} value={birth.day} onChange={(e) => setBirth({ ...birth, day: Number(e.target.value) })}
                    style={inputStyle} />
                </div>
              </div>

              {/* 시간 모름 체크박스 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <input
                  type="checkbox"
                  id="unknownHour"
                  checked={birth.unknownHour}
                  onChange={(e) => setBirth({ ...birth, unknownHour: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#6c63ff" }}
                />
                <label htmlFor="unknownHour" style={{ fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>
                  태어난 시간을 모릅니다
                </label>
              </div>

              {/* 시/분 입력 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, color: birth.unknownHour ? "var(--border)" : "var(--muted)", display: "block", marginBottom: 6 }}>시 (0~23)</label>
                  <input
                    type="number" min={0} max={23}
                    value={birth.hour}
                    onChange={(e) => setBirth({ ...birth, hour: Number(e.target.value) })}
                    disabled={birth.unknownHour}
                    style={{
                      ...inputStyle,
                      opacity: birth.unknownHour ? 0.4 : 1,
                      cursor: birth.unknownHour ? "not-allowed" : "text",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: birth.unknownHour ? "var(--border)" : "var(--muted)", display: "block", marginBottom: 6 }}>분</label>
                  <input
                    type="number" min={0} max={59}
                    value={birth.minute}
                    onChange={(e) => setBirth({ ...birth, minute: Number(e.target.value) })}
                    disabled={birth.unknownHour}
                    style={{
                      ...inputStyle,
                      opacity: birth.unknownHour ? 0.4 : 1,
                      cursor: birth.unknownHour ? "not-allowed" : "text",
                    }}
                  />
                </div>
              </div>

              <button onClick={saveBirth}
                style={{ width: "100%", padding: "14px", background: "#6c63ff", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                저장하고 운세 보기
              </button>
            </div>
          </div>
        )}

        {/* 운세 탭 */}
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

            {/* 결과 */}
            {result && (
              <div>
                {/* 일진 정보 */}
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

                  {/* 사주 원국 */}
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

                {/* 육친 분석 */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ background: "#6c63ff", color: "white", borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>
                      {result.analysis.tenGod}
                    </div>
                    <div style={{ fontSize: 14, color: "var(--muted)" }}>{result.analysis.energy}</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, color: "#00d4aa", marginBottom: 6 }}>✦ 좋은 흐름</div>
                      <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{result.analysis.advice}</div>
                    </div>
                    <div style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 6 }}>⚠ 주의사항</div>
                      <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{result.analysis.caution}</div>
                    </div>
                    <div style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, color: "#a78bfa", marginBottom: 6 }}>🏃 외부활동</div>
                      <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{result.analysis.activity}</div>
                    </div>
                  </div>
                </div>

                {/* 추천 색상 */}
                <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: "#6c63ff", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>// 오늘 추천 색상</p>
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