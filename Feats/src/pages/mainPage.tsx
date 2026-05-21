import React, { useState } from "react";
import "../components/mainPage.css";
import { useNavigate } from "react-router-dom";

/* ============================================================
   타입 정의
   - 원본 HTML에 하드코딩돼 있던 값들을 타입으로 정리.
   - 추후 Spring Boot API 응답을 이 타입에 맞춰 매핑하면 됨.
   ============================================================ */

type Urgency = "urgent" | "warning";
type Storage = "냉장" | "냉동" | "실온";

interface Ingredient {
    id: number;
    name: string;
    quantity: string;
    dDay: number; // 남은 일수 (D-N)
    urgency: Urgency; // 3일 이내: urgent, 7일 이내: warning
    storage: Storage;
    progressPercent: number; // 진행바 너비 (%)
}

interface Recipe {
    id: number;
    name: string;
    icon: string;
    iconBg: string;
    tags: string[];
    matchText: string; // 예: "재료 4/4"
    category: string;
}

interface ExpiringTag {
    name: string;
    dDay: number;
    level: "d1" | "d2" | "d5" | "d6";
}

interface HeroStat {
    num: number;
    label: string;
}

/* ============================================================
   목(mock) 데이터
   - 원본 HTML과 동일한 값.
   - API 연동 전까지 화면 확인용. 연동 시 props 또는 fetch로 대체.
   ============================================================ */

const USER_NAME = "김주연";



const HERO_STATS: HeroStat[] = [
    { num: 16, label: "보유 재료" },
    { num: 3, label: "임박 재료" },
    { num: 24, label: "추천 레시피" },
];

const EXPIRING_TAGS: ExpiringTag[] = [
    { name: "두부", dDay: 1, level: "d1" },
    { name: "계란", dDay: 2, level: "d2" },
    { name: "대파", dDay: 5, level: "d5" },
    { name: "애호박", dDay: 6, level: "d6" },
];

const INGREDIENTS: Ingredient[] = [
    { id: 1, name: "두부", quantity: "1/2 모", dDay: 1, urgency: "urgent", storage: "냉장", progressPercent: 10 },
    { id: 2, name: "계란", quantity: "4 개", dDay: 2, urgency: "urgent", storage: "냉장", progressPercent: 22 },
    { id: 3, name: "대파", quantity: "1 단", dDay: 5, urgency: "warning", storage: "냉장", progressPercent: 50 },
    { id: 4, name: "애호박", quantity: "1 개", dDay: 6, urgency: "warning", storage: "냉장", progressPercent: 60 },
];

const CATEGORIES = ["전체", "한식", "양식", "일식", "중식", "다이어트", "간식"] as const;

const RECIPES: Recipe[] = [
    {
        id: 1,
        name: "두부 계란찜",
        icon: "🥚",
        iconBg: "#e8f5e9",
        tags: ["한식", "10분", "간단"],
        matchText: "재료 4/4",
        category: "한식",
    },
    {
        id: 2,
        name: "대파 계란볶음밥",
        icon: "🍳",
        iconBg: "#fff8e1",
        tags: ["한식", "15분"],
        matchText: "재료 3/4",
        category: "한식",
    },
    {
        id: 3,
        name: "애호박 된장찌개",
        icon: "🥘",
        iconBg: "#f3e5f5",
        tags: ["한식", "20분"],
        matchText: "재료 3/4",
        category: "한식",
    },
];

/* ============================================================
   하위 컴포넌트
   ============================================================ */


const HeroCard: React.FC = () => (
    <div className="hero-card">
        <div className="hero-text">
            <p className="hero-greeting">안녕하세요, {USER_NAME}님 🧡</p>
            <h1 className="hero-title">
                오늘은 <span>두부</span>와 <span>계란</span>으로
                <br />
                무엇을 만들어볼까요?
            </h1>
            <p className="hero-sub">냉장고 속 재료를 최대한 활용한 레시피를 추천해드려요.</p>
        </div>
        <div className="hero-stats">
            {HERO_STATS.map((stat) => (
                <div className="stat-box" key={stat.label}>
                    <div className="num">{stat.num}</div>
                    <div className="label">{stat.label}</div>
                </div>
            ))}
        </div>
    </div>
);

const AlertBar: React.FC = () => {
    const navigate = useNavigate();
    
    return (
    <div className="alert-bar">
        <span className="label">오늘 소비가 권장되는 재료:</span>
        <div className="tags">
            {EXPIRING_TAGS.map((tag) => (
                <span className={`tag ${tag.level}`} key={tag.name}>
                    {tag.name} D-{tag.dDay}
                </span>
            ))}
        </div>
        <div 
            style={{cursor: 'pointer', marginLeft:'auto', fontSize: '90%'}}
            onClick={() => navigate('/recipeMain')}
            
            >
            관련 레시피 보기 →
        </div>

    </div>
);
};

const ExpiringIngredients: React.FC = () => (
    <div className="section-card">
        <div className="section-header">
            <span className="section-title">🧊 유통기한 임박 재료</span>
            <button className="section-more" type="button">
                전체 보기
            </button>
        </div>
        <div className="ingredient-list">
            {INGREDIENTS.map((item) => (
                <div className="ingredient-item" key={item.id}>
                    <span className={`dday-badge ${item.urgency}`}>D-{item.dDay}</span>
                    <div className="ingredient-info">
                        <div className="ingredient-name">{item.name}</div>
                        <div className="ingredient-qty">{item.quantity}</div>
                        <div className="progress-bar">
                            <div
                                className={`progress-fill ${item.urgency}`}
                                style={{ width: `${item.progressPercent}%` }}
                            />
                        </div>
                    </div>
                    <span className="ingredient-where">{item.storage}</span>
                </div>
            ))}
        </div>
    </div>
);

const RecommendedRecipes: React.FC = () => {
    // 카테고리 탭 선택 상태 (원본 HTML의 JS 동작을 React state로 변환)
    const [activeCategory, setActiveCategory] = useState<string>("전체");
    
    // 검색어 입력 상태 (입력은 동작하나, 실제 검색/필터 로직은
    // 백엔드 스펙 미확정으로 제외 — 입력값만 제어 컴포넌트로 보관)
    const [query, setQuery] = useState<string>("");

    const visibleRecipes =
        activeCategory === "전체"
            ? RECIPES
            : RECIPES.filter((r) => r.category === activeCategory);

    return (
        <div className="section-card">
            <div className="section-header">
                <span className="section-title">🍳 오늘의 추천 레시피</span>
                <button className="section-more" type="button">
                    더 보기
                </button>
            </div>

            <div className="recipe-search">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="재료 이름이나 레시피를 검색하세요..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className="category-tabs">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        className={`cat-tab ${activeCategory === cat ? "active" : ""}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="recipe-list">
                {visibleRecipes.map((recipe) => (
                    <div className="recipe-item" key={recipe.id}>
                        <div className="recipe-icon" style={{ background: recipe.iconBg }}>
                            {recipe.icon}
                        </div>
                        <div className="recipe-info">
                            <div className="recipe-name">{recipe.name}</div>
                            <div className="recipe-tags">
                                {recipe.tags.map((tag) => (
                                    <span className="recipe-tag" key={tag}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
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
    return (
        <div className="imf-root">

            <main className="imf-main">
                <HeroCard />
                <AlertBar />

                <div className="bottom-grid">
                    <ExpiringIngredients />
                    <RecommendedRecipes />
                </div>
            </main>

            <footer className="imf-footer" />
        </div>
    );
};

export default MainPage;