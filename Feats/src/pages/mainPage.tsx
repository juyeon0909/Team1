import React, { useEffect, useState } from "react";
import "../components/mainPage.css";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

/* ============================================================
   타입 정의
   ============================================================ */

type Urgency = "urgent" | "warning" | "normal";
type Storage = "냉장" | "냉동" | "실온";

interface Ingredient {
    id: number;
    itemname: string;
    quantity: number;
    dDay: number;
    urgency: Urgency;
    storagetype: Storage;
    progressPercent: number;
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

interface HeroStat {
    num: number;
    label: string;
}

/* ============================================================
   목(mock) 데이터 — 레시피는 API 미연동 상태
   ============================================================ */

const HERO_STATS: HeroStat[] = [
    { num: 16, label: "보유 재료" },
    { num: 3, label: "임박 재료" },
    { num: 24, label: "추천 레시피" },
];

const CATEGORIES = ["전체", "한식", "양식", "일식", "중식", "간식", "야식" , "다이어트" , "밀프랩" ] as const;

const RECIPES: Recipe[] = [
    {
        id: 1,
        name: "두부 계란찜",
        icon: "",
        iconBg: "#e8f5e9",
        tags: ["한식", "10분", "간단"],
        matchText: "재료 4/4",
        category: "한식",
    },
    {
        id: 2,
        name: "대파 계란볶음밥",
        icon: "",
        iconBg: "#fff8e1",
        tags: ["한식", "15분"],
        matchText: "재료 3/4",
        category: "한식",
    },
    {
        id: 3,
        name: "애호박 된장찌개",
        icon: "",
        iconBg: "#f3e5f5",
        tags: ["한식", "20분"],
        matchText: "재료 3/4",
        category: "한식",
    },
];

/* ============================================================
   하위 컴포넌트
   ============================================================ */

interface HeroCardProps {
    userName: string;
}
const HeroCard: React.FC<HeroCardProps> = ({ userName }) => (
    <div className="hero-card">
        <div className="hero-text">
            <p className="hero-greeting">안녕하세요, {userName}님</p>
            <h1 className="hero-title">
                냉장고 속 재료로
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

interface AlertBarProps {
    ingredients: Ingredient[];
}
const AlertBar: React.FC<AlertBarProps> = ({ ingredients }) => {
    const navigate = useNavigate();

    const urgentItems = ingredients.filter((i) => i.urgency === "urgent" || i.urgency === "warning");

    const levelOf = (dDay: number): string => {
        if (dDay <= 1) return "d1";
        if (dDay <= 2) return "d2";
        if (dDay <= 5) return "d5";
        return "d6";
    };

    return (
        <div className="alert-bar">
            <span className="label">오늘 소비가 권장되는 재료:</span>
            <div className="tags">
                {urgentItems.length > 0 ? (
                    urgentItems.map((item) => (
                        <span className={`tag ${levelOf(item.dDay)}`} key={item.id}>
                            {item.itemname} D-{item.dDay}
                        </span>
                    ))
                ) : (
                    <span className="tag d6">임박 재료 없음</span>
                )}
            </div>
            <div
                style={{ cursor: "pointer", marginLeft: "auto", fontSize: "90%" }}
                onClick={() => navigate("/recipeMain")}
            >
                관련 레시피 보기 →
            </div>
        </div>
    );
};

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
                <button className="section-more" type="button" onClick={() => navigate("/product/insert")}>
                    전체 보기
                </button>
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
                                {item.dDay >= 0 ? `D-${item.dDay}` : `D+${Math.abs(item.dDay)}`}
                            </span>
                            <div className="ingredient-info">
                                <div className="ingredient-name">{item.itemname}</div>
                                <div className="ingredient-qty">{item.quantity} 개</div>
                                <div className="progress-bar">
                                    <div
                                        className={`progress-fill ${item.urgency}`}
                                        style={{ width: `${item.progressPercent}%` }}
                                    />
                                </div>
                            </div>
                            <span className="ingredient-where">{item.storagetype}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const RecommendedRecipes: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<string>("전체");
    const [query, setQuery] = useState<string>("");

    const visibleRecipes =
        activeCategory === "전체"
            ? RECIPES
            : RECIPES.filter((r) => r.category === activeCategory);

    return (
        <div className="section-card">
            <div className="section-header">
                <span className="section-title">오늘의 추천 레시피</span>
                <button className="section-more" type="button">
                    더 보기
                </button>
            </div>

            <div className="recipe-search">
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
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("사용자");

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            setLoading(false);
            return;
        }

        const user = JSON.parse(stored);
        if (user.name) setUserName(user.name);

        const memberId: number = user.id;
        axiosInstance
            .get<Ingredient[]>(`/product/expiring/${memberId}`)
            .then((res) => setIngredients(res.data))
            .catch(() => setIngredients([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="imf-root">
            <main className="imf-main">
                <HeroCard userName={userName} />
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
