import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import axiosInstance from "../api/axiosInstance";
import type { Ingredient } from "../types/Fridge.ts";
import type { User } from "../types/User.ts";
import { API_BASE_URL } from "../config/config";
import "../components/mainPage.css";
import Carousel from "react-bootstrap/esm/Carousel";
import 'bootstrap/dist/css/bootstrap.min.css';

const CATEGORIES = ["전체", "한식", "양식", "일식", "중식", "간식", "야식", "다이어트", "밀프랩"] as const;

// 설명 텍스트 20자 자르기
const truncate = (text?: string, max = 20) =>
    !text ? '' : text.length > max ? text.substring(0, max) + '...' : text;

// ─── 하위 컴포넌트 1: 히어로 배너 캐러셀 ───────────────────────────────────────
interface HeroCardProps {
    userName: string;
    totalCount: number;
    urgentCount: number;
    recommendRecipe: number;
    popularRecipe?: any;
    urgentRecipe?: any;
}

const HeroCard: React.FC<HeroCardProps> = ({ userName, popularRecipe, urgentRecipe }) => {
    const navigate = useNavigate();
    const detailView = (id: number) => navigate(`/recipeMain/${id}`);

    return (
        <Carousel>
            {/* 슬라이드 1: 인사 배너 */}
            <Carousel.Item>
                <div className="hero-slide-bg hero-bg-greeting">
                    <p className="hero-greeting-sub">안녕하세요, {userName}님</p>
                    <h1 className="hero-greeting-title">
                        냉장고 속 재료로<br />무엇을 만들어볼까요?
                    </h1>
                    <p className="hero-greeting-desc">
                        냉장고 속 재료를 최대한 활용한 맞춤형 레시피를 추천해드려요.
                    </p>
                </div>
            </Carousel.Item>

            {/* 슬라이드 2: 가장 인기 많은 레시피 — 항상 렌더링, 데이터 있을 때만 내용 표시 */}
            <Carousel.Item
                style={{ cursor: popularRecipe ? 'pointer' : 'default' }}
                onClick={popularRecipe ? () => detailView(popularRecipe.id) : undefined}
            >
                {popularRecipe?.image ? (
                    <img className="hero-slide-img" src={popularRecipe.image} alt={popularRecipe.title} />
                ) : (
                    <div className="hero-slide-bg hero-bg-popular" />
                )}
                {popularRecipe && (
                    <Carousel.Caption>
                        <p className="hero-caption-label">지금 가장 인기 있는 레시피</p>
                        <h3>{popularRecipe.title}</h3>
                        <p>
                            {popularRecipe.description && <> &nbsp;·&nbsp; {truncate(popularRecipe.description)}</>}
                        </p>
                    </Carousel.Caption>
                )}
            </Carousel.Item>

            {/* 슬라이드 3: 임박 재료 레시피 — 항상 렌더링, 데이터 있을 때만 내용 표시 */}
            <Carousel.Item
                style={{ cursor: urgentRecipe ? 'pointer' : 'default' }}
                onClick={urgentRecipe ? () => detailView(urgentRecipe.id) : undefined}
            >
                {urgentRecipe?.image ? (
                    <img className="hero-slide-img" src={urgentRecipe.image} alt={urgentRecipe.title} />
                ) : (
                    <div className="hero-slide-bg hero-bg-urgent" />
                )}
                {urgentRecipe && (
                    <Carousel.Caption>
                        <p className="hero-caption-label">임박 재료로 만들 수 있어요</p>
                        <h3>{urgentRecipe.title}</h3>
                        <p>{truncate(urgentRecipe.description)}</p>
                    </Carousel.Caption>
                )}
            </Carousel.Item>
        </Carousel>
    );
};

// ─── 하위 컴포넌트 2: 유통기한 알림 띠 바 ──────────────────────────────────────
interface AlertBarProps {
    ingredients: Ingredient[];
    isLoggedIn: boolean;
}

const AlertBar: React.FC<AlertBarProps> = ({ ingredients, isLoggedIn }) => {
    const navigate = useNavigate();
    const urgentItems = isLoggedIn
        ? ingredients.filter((i) =>
            (i.urgency === "urgent" || i.urgency === "warning") &&
            i.dDay !== undefined &&
            i.dDay >= 0
        )
        : [];

    return (
        <div className="alert-bar">
            <span className="label">오늘 소비가 권장되는 재료:</span>
            <div className="tags">
                {!isLoggedIn ? (
                    <span className="tag d1">로그인 후 이용 가능</span>
                ) : urgentItems.length > 0 ? (
                    urgentItems.map((item) => (
                        <span className={`tag ${item.urgency === "urgent" ? "d1" : "d5"}`} key={item.id}>
                            {item.itemName} D-{item.dDay}
                        </span>
                    ))
                ) : (
                    <span className="tag d6">임박 재료 없음</span>
                )}
            </div>
            <span
                className="alert-link"
                onClick={() => navigate("/recipeMain", { state: { urgentOnly: true } })}
                style={{ cursor: "pointer" }}
            >
                관련 레시피 보기 →
            </span>
        </div>
    );
};

// ─── 하위 컴포넌트 3: 유통기한 임박 재료 리스트 ────────────────────────────────
interface ExpiringIngredientsProps {
    ingredients: Ingredient[];
    isLoggedIn: boolean;
}

const ExpiringIngredients: React.FC<ExpiringIngredientsProps> = ({ ingredients, isLoggedIn }) => {
    const navigate = useNavigate();

    return (
        <div className="section-card">
            <div className="section-header">
                <span className="section-title">유통기한 임박 재료</span>
                <button className="section-more" type="button" onClick={() => navigate("/product/insert")}>전체 보기</button>
            </div>
            <div className="ingredient-list">
                {!isLoggedIn ? (
                    <p className="empty-message">로그인 후 사용 가능합니다.</p>
                ) : ingredients.length === 0 ? (
                    <p className="empty-message">임박 재료가 없습니다.</p>
                ) : (
                    ingredients.map((item) => (
                        <div className="ingredient-item" key={item.id}>
                            <span className={`dday-badge ${item.urgency}`}>
                                {Number(item.dDay) >= 0 ? `D-${item.dDay}` : `D+${Math.abs(Number(item.dDay))}`}
                            </span>
                            <div className="ingredient-info">
                                <div className="ingredient-name">{item.itemName || item.name}</div>
                                <div className="ingredient-qty">{item.quantity}g</div>
                            </div>
                            <span className="ingredient-where">
                                {item.storageType === "ROOM_TEMP" || item.storageType === "실온" ? "실온" :
                                    item.storageType === "FROZEN" || item.storageType === "냉동" ? "냉동" : "냉장"}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// ─── 하위 컴포넌트 4: 추천 레시피 ───────────────────────────────────────────────
interface RecommendedRecipesProps {
    recipes: any[];
    isLoggedIn: boolean;
}

const CATEGORY_MAP: Record<string, string> = {
    "한식": "KOR", "일식": "JAN", "중식": "CHN", "양식": "YANG",
    "간식": "GAN", "야식": "YA", "다이어트": "DIET", "밀프랩": "RAP",
};

const RecommendedRecipes: React.FC<RecommendedRecipesProps> = ({ recipes, isLoggedIn }) => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState<string>("전체");
    const [query, setQuery] = useState<string>("");

    const visibleRecipes = useMemo(() => {
        return recipes.filter((r) => {
            if (activeCategory !== "전체") {
                if (r.category !== CATEGORY_MAP[activeCategory]) return false;
            }
            if (query.trim()) {
                const q = query.toLowerCase();
                const titleMatch = r.title?.toLowerCase().includes(q);
                const tagMatch = Array.isArray(r.tags) && r.tags.some((t: string) => t.toLowerCase().includes(q));
                const mustMatch = Array.isArray(r.mustIngredients) && r.mustIngredients.some((ing: any) => ing.name?.toLowerCase().includes(q));
                const selectMatch = Array.isArray(r.selectIngredients) && r.selectIngredients.some((ing: any) => ing.name?.toLowerCase().includes(q));
                return titleMatch || tagMatch || mustMatch || selectMatch;
            }
            return true;
        }).slice(0, 3);
    }, [recipes, activeCategory, query]);

    return (
        <div className="section-card">
            <div className="section-header">
                <span className="section-title">오늘의 추천 레시피</span>
                <button className="section-more" type="button" onClick={() => navigate("/recipeMain")}>더 보기</button>
            </div>
            <div className="recipe-search">
                <span className="search-icon"></span>
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
                {visibleRecipes.length === 0 ? (
                    <p className="empty-message lg">조건에 맞는 추천 레시피가 없습니다.</p>
                ) : (
                    visibleRecipes.map((recipe) => (
                        <div
                            className="recipe-item"
                            key={recipe.id}
                            onClick={() => navigate(`/recipeMain/${recipe.id}`)}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="recipe-icon" style={{ background: recipe.iconBg || "#f1f5f9" }}>
                                {recipe.icon || "🍽️"}
                            </div>
                            <div className="recipe-info">
                                <div className="recipe-name">{recipe.title}</div>
                                <div className="recipe-tags">
                                    {recipe.tags?.slice(0, 3).map((tag: string) => (
                                        <span className="recipe-tag" key={tag}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                            {isLoggedIn ? (
                                <span className="recipe-match match-rate">일치율 {recipe.match ?? 0}%</span>
                            ) : (
                                <span className="recipe-match heart-count">❤️ {recipe.heart ?? 0}</span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────────
const MainPage: React.FC = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [recipes, setRecipes] = useState<any[]>([]);
    const [userName, setUserName] = useState("사용자");
    const [totalCount, setTotalCount] = useState(0);
    const [recommendRecipe, setRecommendRecipe] = useState(0);
    const [urgentCount, setUrgentCount] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const fetchMainRecipes = async () => {
            try {
                const response = await axios.get<any[]>(`${API_BASE_URL}/recipeMain`);
                let mapped = (response.data || []).map((r: any) => ({
                    ...r,
                    title: r.title || r.name || "이름 없는 레시피",
                    heart: r.heart !== undefined ? r.heart : (r.likes || r.likeCount || r.viewCount || 0),
                }));

                if (isLoggedIn) {
                    try {
                        const matchRes = await axiosInstance.get('/recipeMain/match');
                        if (Array.isArray(matchRes.data)) {
                            const rateMap = new Map<number, number>(
                                matchRes.data.map((m: any) => [m.id, m.matchRate ?? 0])
                            );
                            mapped.forEach((r) => {
                                if (rateMap.has(r.id)) r.match = rateMap.get(r.id)!;
                            });
                        }
                    } catch (matchErr) {
                        console.error('메인페이지 매칭률 연동 실패:', matchErr);
                    }
                    mapped = [...mapped].sort((a, b) => (b.match || 0) - (a.match || 0));
                } else {
                    mapped = [...mapped].sort((a, b) => (b.heart || 0) - (a.heart || 0));
                }

                setRecipes(mapped);
                setRecommendRecipe(mapped.length);
            } catch (error) {
                console.error('메인페이지 레시피 로딩 실패:', error);
            }
        };

        fetchMainRecipes();
    }, [isLoggedIn]);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) return;

        let user: User;
        try {
            user = JSON.parse(stored);
        } catch {
            return;
        }

        if (user.name) setUserName(user.name);
        setIsLoggedIn(true);

        axiosInstance.get<any[]>(`/product/list/${user.id}`)
            .then((res) => {
                const rawData = res.data || [];
                setTotalCount(rawData.length);

                const processed = rawData.map((item) => {
                    const serverDday = item.dDay !== undefined ? item.dDay : item.dday;
                    return {
                        ...item,
                        itemName: item.itemName || item.itemname || "이름 없음",
                        storageType: item.storageType || item.storagetype || "REFRIGERATED",
                        expirationDate: item.expirationDate || item.expirationdate,
                        dDay: serverDday !== undefined ? serverDday : 999,
                        urgency: item.urgency || "normal",
                    };
                });

                setUrgentCount(
                    processed.filter((i) =>
                        (i.urgency === "urgent" || i.urgency === "warning") &&
                        i.dDay !== undefined && i.dDay >= 0
                    ).length
                );

                const finalMainList = processed
                    .filter((i) =>
                        (i.urgency === "urgent" || i.urgency === "warning") &&
                        i.dDay !== undefined && i.dDay >= 0
                    )
                    .sort((a, b) => (a.dDay ?? 0) - (b.dDay ?? 0))
                    .slice(0, 5);

                setIngredients(finalMainList);
            })
            .catch((err) => console.error("데이터 연동 실패:", err));
    }, []);

    // 가장 인기 많은 레시피 (heart 기준 상위 1개)
    const popularRecipe = recipes.length > 0
        ? [...recipes].sort((a, b) => (b.heart ?? b.likeCount ?? 0) - (a.heart ?? a.likeCount ?? 0))[0]
        : null;

    // 임박 재료 이름과 레시피 재료를 매칭해 찾은 레시피 1개
    const urgentIngredientNames = ingredients.map((i) =>
        (i.itemName || i.name || "").toLowerCase().trim()
    );
    const urgentRecipe = urgentIngredientNames.length > 0
        ? (recipes.find((r) => {
            const allIngs: any[] = [...(r.mustIngredients || []), ...(r.selectIngredients || [])];
            return allIngs.some((ing: any) => {
                const ingName = (ing.name || "").toLowerCase().trim();
                return urgentIngredientNames.some(
                    (n) => n && (ingName.includes(n) || n.includes(ingName))
                );
            });
        }) ?? null)
        : null;

    return (
        <div className="imf-root">
            <main className="imf-main">
                <HeroCard
                    userName={userName}
                    totalCount={totalCount}
                    urgentCount={urgentCount}
                    recommendRecipe={recommendRecipe}
                    popularRecipe={popularRecipe}
                    urgentRecipe={urgentRecipe}
                />
                <AlertBar ingredients={ingredients} isLoggedIn={isLoggedIn} />
                <div className="bottom-grid">
                    <ExpiringIngredients ingredients={ingredients} isLoggedIn={isLoggedIn} />
                    <RecommendedRecipes recipes={recipes} isLoggedIn={isLoggedIn} />
                </div>
            </main>
            <footer className="imf-footer" />
        </div>
    );
};

export default MainPage;
