import React, { useEffect, useState } from "react";
import "../components/mainPage.css"; 
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

type Urgency = "urgent" | "warning" | "normal";

interface Ingredient {
    id: number;
    itemname: string;
    quantity: number;
    expirationdate: string; 
    storagetype: string;    
    dDay?: number;
    urgency?: Urgency;
}

interface Recipe {
    id: number;
    name: string;
    icon: string;
    iconBg: string;
    tags: string[];
    matchText: string;
    category: string;
}

const CATEGORIES = ["전체", "한식", "양식", "일식", "중식", "간식", "야식", "다이어트", "밀프랩"] as const;

const RECIPES: Recipe[] = [
    { id: 1, name: "두부 계란찜", icon: "🍳", iconBg: "#e8f5e9", tags: ["한식", "10분", "간단"], matchText: "재료 4/4", category: "한식" },
    { id: 2, name: "대파 계란볶음밥", icon: "🍚", iconBg: "#fff8e1", tags: ["한식", "15분"], matchText: "재료 3/4", category: "한식" },
    { id: 3, name: "애호박 된장찌개", icon: "🥘", iconBg: "#f3e5f5", tags: ["한식", "20분"], matchText: "재료 3/4", category: "한식" }
];


//    하위 컴포넌트 1: 오토 슬라이드 히어로 배너
   
interface HeroCardProps {
    userName: string;
    totalCount: number;
    urgentCount: number;
}

const HeroCard: React.FC<HeroCardProps> = ({ userName, totalCount, urgentCount }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const banners = [
        { id: 0, greeting: `안녕하세요, ${userName}님`, title: <>냉장고 속 재료로<br />무엇을 만들어볼까요?</>, sub: "냉장고 속 재료를 최대한 활용한 맞춤형 레시피를 추천해드려요." },
        { id: 1, greeting: "요리 팁", title: <>맛있는 <br />요리</>, sub: "냉장고 속 재료를 최대한 활용한 맞춤형 레시피를 추천해드려요1." },
        { id: 2, greeting: "요리고수", title: <>재밌는<br />요리</>, sub: "냉장고 속 재료를 최대한 활용한 맞춤형 레시피를 추천해드려요2." }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3); 
        }, 5000);
        return () => clearInterval(timer);
    }, []); 

    return (
        <div className="hero-card">
            <div className="hero-carousel-container">
                <div className="hero-text">
                    <p className="hero-greeting">{banners[currentSlide].greeting}</p>
                    <h1 className="hero-title">{banners[currentSlide].title}</h1>
                    <p className="hero-sub">{banners[currentSlide].sub}</p>
                </div>

                <button className="carousel-nav-btn prev" onClick={() => setCurrentSlide(p => p === 0 ? 2 : p - 1)}>〈</button>
                <button className="carousel-nav-btn next" onClick={() => setCurrentSlide(p => (p + 1) % 3)}>〉</button>

                <div className="carousel-page-dots">
                    {banners.map((_, idx) => (
                        <span key={idx} className={`carousel-dot ${currentSlide === idx ? "active" : ""}`} onClick={() => setCurrentSlide(idx)} />
                    ))}
                </div>
            </div>

            <div className="hero-stats">
                <div className="stat-box"><div className="num">{totalCount}</div><div className="label">보유 재료</div></div>
                <div className="stat-box"><div className="num urgent-highlight">{urgentCount}</div><div className="label">임박 재료</div></div>
                <div className="stat-box"><div className="num">24</div><div className="label">추천 레시피</div></div>
            </div>
        </div>
    );
};


//    하위 컴포넌트 2: 유통기한 알림 띠 바

const AlertBar: React.FC<{ ingredients: Ingredient[] }> = ({ ingredients }) => {
    const navigate = useNavigate();
    const urgentItems = ingredients.filter((i) => i.urgency === "urgent" || i.urgency === "warning");
    
    return (
        <div className="alert-bar">
            <span className="label">오늘 소비가 권장되는 재료:</span>
            <div className="tags">
                {urgentItems.length > 0 ? (
                    urgentItems.map((item) => (
                        <span className={`tag ${item.urgency === "urgent" ? "d1" : "d5"}`} key={item.id}>
                            {item.itemname} D-{item.dDay}
                        </span>
                    ))
                ) : (
                    <span className="tag d6">임박 재료 없음</span>
                )}
            </div>
            <span className="alert-link" onClick={() => navigate("/recipeMain")} style={{ cursor: "pointer" }}>
                관련 레시피 보기 →
            </span>
        </div>
    );
};

/* ============================================================
   하위 컴포넌트 3: 유통기한 임박 재료 리스트
   ============================================================ */
interface ExpiringIngredientsProps {
    ingredients: Ingredient[];
    loading: boolean;
}
const ExpiringIngredients: React.FC<ExpiringIngredientsProps> = ({ ingredients, loading }) => {
    const navigate = useNavigate();

    return (
        <div className="section-card">
            <div className="section-header">
                <span className="section-title">유통기한 임박 재료</span>
                <button className="section-more" type="button" onClick={() => navigate("/product/insert")}>전체 보기</button>
            </div>
            <div className="ingredient-list">
                {loading ? (
                    <p style={{ textAlign: "center", color: "#999", padding: "1rem" }}>불러오는 중...</p>
                ) : ingredients.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#999", padding: "1rem" }}>임박 재료가 없습니다.</p>
                ) : (
                    ingredients.map((item) => (
                        <div className="ingredient-item" key={item.id}>
                            <span className={`dday-badge ${item.urgency}`}>
                                {Number(item.dDay) >= 0 ? `D-${item.dDay}` : `D+${Math.abs(Number(item.dDay))}`}
                            </span>
                            <div className="ingredient-info">
                                <div className="ingredient-name">{item.itemname}</div>
                                <div className="ingredient-qty">{item.quantity}g</div>
                            </div>
                            <span className="ingredient-where">
                                {item.storagetype === "ROOM_TEMP" || item.storagetype === "실온" ? "실온" : 
                                 item.storagetype === "FROZEN" || item.storagetype === "냉동" ? "냉동" : "냉장"}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

/* ============================================================
   하위 컴포넌트 4: 오늘의 추천 레시피 구역
   ============================================================ */
const RecommendedRecipes: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<string>("전체");
    const [query, setQuery] = useState<string>("");

    const visibleRecipes = activeCategory === "전체" ? RECIPES : RECIPES.filter((r) => r.category === activeCategory);

    return (
        <div className="section-card">
            <div className="section-header"><span className="section-title">오늘의 추천 레시피</span><button className="section-more" type="button">더 보기</button></div>
            <div className="recipe-search">
                <span className="search-icon">🔍</span>
                <input type="text" placeholder="재료 이름이나 레시피를 검색하세요..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="category-tabs">
                {CATEGORIES.map((cat) => (
                    <button key={cat} type="button" className={`cat-tab ${activeCategory === cat ? "active" : ""}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
                ))}
            </div>
            <div className="recipe-list">
                {visibleRecipes.map((recipe) => (
                    <div className="recipe-item" key={recipe.id}>
                        <div className="recipe-icon" style={{ background: recipe.iconBg }}>{recipe.icon}</div>
                        <div className="recipe-info">
                            <div className="recipe-name">{recipe.name}</div>
                            <div className="recipe-tags">{recipe.tags.map((tag) => <span className="recipe-tag" key={tag}>{tag}</span>)}</div>
                        </div>
                        <span className="recipe-match">{recipe.matchText}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ============================================================
   메인 컴포넌트
   ============================================================ */
const MainPage: React.FC = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("사용자");
    const [totalCount, setTotalCount] = useState(0);
    const [urgentCount, setUrgentCount] = useState(0);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) { gap: setLoading(false); return; }

        const user = JSON.parse(stored);
        if (user.name) setUserName(user.name);
        
        axiosInstance.get<any[]>(`/product/list/${user.id}`)
            .then((res) => {
                const rawData = res.data || [];
                setTotalCount(rawData.length);

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // 데이터 파싱 및 D-Day 일괄 자체 연산
                const processed = rawData.map((item) => {
                    const targetDateStr = item.expirationdate || item.expiry;
                    let dDayResult = 999;
                    let urgencyResult: Urgency = "normal";

                    if (targetDateStr) {
                        const expDate = new Date(targetDateStr);
                        expDate.setHours(0, 0, 0, 0);
                        dDayResult = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                        if (dDayResult <= 3) urgencyResult = "urgent";
                        else if (dDayResult <= 7) urgencyResult = "warning";
                    }

                    return {
                        ...item,
                        itemname: item.itemname || item.name || "이름 없음",
                        dDay: dDayResult,
                        urgency: urgencyResult
                    };
                });

                // 스탯용 전체 임박 카운트 세팅
                setUrgentCount(processed.filter(i => i.urgency === "urgent" || i.urgency === "warning").length);

                // 하단 보드용: D-3 이하 필터링 -> 정렬 -> 상위 5개 슬라이싱
                const finalMainList = processed
                    .filter(i => i.urgency === "urgent")
                    .sort((a, b) => (a.dDay ?? 0) - (b.dDay ?? 0))
                    .slice(0, 5);

                setIngredients(finalMainList);
            })
            .catch((err) => console.error("데이터 연동 실패:", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="imf-root">
            <main className="imf-main">
                <HeroCard userName={userName} totalCount={totalCount} urgentCount={urgentCount} />
                <AlertBar ingredients={ingredients} />
                <div className="bottom-grid">
                    <ExpiringIngredients ingredients={ingredients} loading={loading} />
                    <RecommendedRecipes />
                </div>
            </main>
            <footer className="imf-footer" />
        </div>
    );
};

export default MainPage;