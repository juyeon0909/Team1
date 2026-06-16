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
import M2 from '../assets/M2.jpg';
import M3 from '../assets/M3.jpg';
import RecipeCard from '../pages/RecipeCard';
import FridgeIntro from "./Fridgeintro.tsx";
import { notifyError } from "../utils/notifyError";



const CATEGORIES = ["전체", "한식", "양식", "일식", "중식", "간식", "야식", "다이어트", "밀프랩"] as const;

// 설명 텍스트 20자 자르기
const truncate = (text?: string, max = 20) =>
    !text ? '' : text.length > max ? text.substring(0, max) + '...' : text;

// ─ 하위 컴포넌트 1: 히어로 배너 캐러셀 ─
interface HeroCardProps {
    userName: string;
    totalCount: number;
    urgentCount: number;
    recommendRecipe: number;
    popularRecipe?: any;
    ScrapRecipe?: any;
    urgentRecipe?: any;
}

const HeroCard: React.FC<HeroCardProps> = ({ userName, popularRecipe, ScrapRecipe, urgentRecipe }) => {
    const navigate = useNavigate();
    const detailView = (id: number) => navigate(`/recipeMain/${id}`);

    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <Carousel activeIndex={activeIndex} onSelect={(selectedIndex: number) => setActiveIndex(selectedIndex)} interval={8800}>
            {/* 슬라이드 1: 냉장고 인트로 애니메이션 */}
            <Carousel.Item>
                <div className="hero-slide-bg hero-bg-greeting">
                    <FridgeIntro isActive={activeIndex === 0} userName={userName} />
                </div>
            </Carousel.Item>

            {/* 슬라이드 2: 가장 좋아요 많은 레시피 */}
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
                        <p className="hero-caption-label">지금 가장 좋아요 많은 레시피</p>
                        <h3>{popularRecipe.title}</h3>
                        <p>
                            {popularRecipe.description && <> &nbsp;·&nbsp; {truncate(popularRecipe.description)}</>}
                        </p>
                    </Carousel.Caption>
                )}
            </Carousel.Item>

            {/* 슬라이드 3: 가장 스크랩 많은 레시피 */}
            <Carousel.Item
                style={{ cursor: ScrapRecipe ? 'pointer' : 'default' }}
                onClick={ScrapRecipe ? () => detailView(ScrapRecipe.id) : undefined}
            >
                {ScrapRecipe?.image ? (
                    <img className="hero-slide-img" src={ScrapRecipe.image} alt={ScrapRecipe.title} />
                ) : (
                    <div className="hero-slide-bg hero-bg-scrap" />
                )}
                {ScrapRecipe && (
                    <Carousel.Caption>
                        <p className="hero-caption-label">지금 가장 스크랩 많은 레시피</p>
                        <h3>{ScrapRecipe.title}</h3>
                        <p>
                            {ScrapRecipe.description && <> &nbsp;·&nbsp; {truncate(ScrapRecipe.description)}</>}
                        </p>
                    </Carousel.Caption>
                )}
            </Carousel.Item>

            {/* 슬라이드 4: 임박 재료 레시피 — 임박 재료가 없으면 슬라이드 자체를 숨김 */}
            {urgentRecipe && (
                <Carousel.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => detailView(urgentRecipe.id)}
                >
                    {urgentRecipe.image ? (
                        <img className="hero-slide-img" src={urgentRecipe.image} alt={urgentRecipe.title} />
                    ) : (
                        <div className="hero-slide-bg hero-bg-urgent" />
                    )}
                    <Carousel.Caption>
                        <p className="hero-caption-label">임박 재료로 만들 수 있어요</p>
                        <h3>{urgentRecipe.title}</h3>
                        <p>{truncate(urgentRecipe.description)}</p>
                    </Carousel.Caption>
                </Carousel.Item>
            )}
        </Carousel>
    );
};






// ─ 하위 컴포넌트 2: 유통기한 알림 띠 바 
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
/*----- Qna, 레시피 승인 ------- (관리자만) */
interface AdminQnaItem {
    id: number;
    memberName: string;
    qnaType: string;
    title: string;
    status: string;
}

interface AdminQnaProps {
    qnas: AdminQnaItem[];
    isLoggedIn: boolean;
}

interface AdminRecipeItem {
    id: number;
    title: string;
    category: string;
    registeredAt: string;
    image?: string;
}

interface AdminRecipeProps {
    recipes: AdminRecipeItem[];
    isLoggedIn: boolean;
}

// 글로벌 카테고리 맵 (RecommendedRecipes와 중복되지 않도록 파일 최상단에 배치 권장)
const ADMIN_CATEGORY_MAP: Record<string, string> = {
    "한식": "KOR", "일식": "JAN", "중식": "CHN", "양식": "YANG",
    "간식": "GAN", "야식": "YA", "다이어트": "DIET", "밀프랩": "RAP",
};

const AdminQna: React.FC<AdminQnaProps> = ({ qnas, isLoggedIn }) => {
    const navigate = useNavigate();

    return (
        <div className="section-card">
            <div className="section-header">
                <span className="section-title">1:1 문의 내역</span>
                <button className="section-more" type="button" onClick={() => navigate("/admin/qna")}>
                    전체 보기
                </button>
            </div>
            <div className="admin-qna-list">
                {!isLoggedIn ? (
                    <p className="empty-message">관리자 로그인 후 사용 가능합니다.</p>
                ) : qnas.length === 0 ? (
                    <p className="empty-message">문의 내역이 없습니다.</p>
                ) : (

                    qnas.map((item) => (
                        <div className="qna-item" key={item.id} onClick={() => navigate(`/admin/qna`)}>
                            <span className={`status-badge ${item.status === '접수중' ? 'waiting' : 'completed'}`}>
                                {item.status}
                            </span>
                            <div className="qna-info">
                                <div className="qna-title">{item.title}</div>
                                <div className="qna-sub">{item.memberName} | {item.qnaType}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const AdminRecipe: React.FC<AdminRecipeProps> = ({ recipes, isLoggedIn }) => {
    const navigate = useNavigate();

    return (
        <div className="section-card">
            <div className="section-header">
                <span className="section-title">레시피 승인 관리</span>
                <button className="section-more" type="button" onClick={() => navigate("/admin/recipe")}>
                    전체 보기
                </button>
            </div>
            <div className="admin-recipe-list">
                {!isLoggedIn ? (
                    <p className="empty-message">관리자 로그인 후 사용 가능합니다.</p>
                ) : recipes.length === 0 ? (
                    <p className="empty-message">승인 처리할 레시피가 없습니다.</p>
                ) : (
                    recipes.map((item) => (
                        <div className="admin-recipe-item" key={item.id} onClick={() => navigate(`/admin/recipes/${item.id}`)}>
                            {item.image && <img src={item.image} alt={item.title} className="recipe-thumb" />}
                            <div className="recipe-info">
                                <div className="recipe-title">{item.title}</div>
                                <div className="recipe-sub">{item.category} | {item.registeredAt}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// ─ 하위 컴포넌트 3: 유통기한 임박 재료 리스트 
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

// ─ 하위 컴포넌트 4: 추천 레시피 ─
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
                                {recipe.image ? (
                                    <img src={recipe.image} alt={recipe.title} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                                ) : (
                                    <span>🍽️</span>
                                )}
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

// ─ 메인 컴포넌트 ─
const MainPage: React.FC = () => {

     const [qnas, setQnas] = useState<AdminQnaItem[]>([]);
     const [adminRecipes, setAdminRecipes] = useState<AdminRecipeItem[]>([]);
     const [isAdmin, setIsAdmin] = useState(false);

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
                        // 매칭률은 부가 정보이므로 실패해도 목록 표시는 계속한다(콘솔만 기록).
                        console.error('메인페이지 매칭률 연동 실패:', matchErr);
                    }
                }
                // 정렬은 아래 sortedRecipes(useMemo)에서 임박재료 -> 일치율 -> 인기순으로 일괄 처리한다.

                setRecipes(mapped);
                setRecommendRecipe(mapped.length);
            } catch (error) {
                notifyError(error, '추천 레시피를 불러오지 못했습니다.');
            }
        };

        fetchMainRecipes();
    }, [isLoggedIn]);

    useEffect(() => {
            const stored = localStorage.getItem("user");
            const token = localStorage.getItem("accessToken");
            if (!stored || !token) return;

            let user: User;
            try {
                user = JSON.parse(stored);
            } catch {
                return;
            }

            if (user.name) setUserName(user.name);
            setIsLoggedIn(true);

            //  관리자 판별 (role 기반) 
           if (user.role === "ADMIN") {
               setIsAdmin(true);

               axiosInstance.get<any>("/admin/qnas")
                   .then((res) => {
                       console.log("QnA 응답 ▶", res.data); 
                       const list = Array.isArray(res.data)
                           ? res.data
                           : (res.data.content || res.data.data || res.data.list || []);
                       setQnas(list);
                   })
                   .catch((err) => notifyError(err, "문의 목록을 불러오지 못했습니다."));

               axiosInstance.get<any>("/admin/recipes/pending")
                   .then((res) => {
                       console.log("Recipe 응답 ▶", res.data);
                       const list = Array.isArray(res.data)
                           ? res.data
                           : (res.data.content || res.data.data || res.data.list || []);
                       setAdminRecipes(list);
                   })
                   .catch((err) => notifyError(err, "레시피 승인 목록을 불러오지 못했습니다."));
           }
           
  //  사용자 판별 (role 기반) 
            if (user.role === "USER") {

            //  냉장고 재료 목록
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
                .catch((err) => notifyError(err, "냉장고 재료 목록을 불러오지 못했습니다."));
                }
        }, []);

    // 임박 재료 이름 집합 (소문자/공백 정리) — 추천 레시피 1순위 정렬 기준
    // ingredients가 바뀔 때만 다시 계산한다.
    const urgentIngredientNameSet = useMemo(() => {
        return new Set(
            ingredients
                .map((i) => (i.itemName || i.name || "").toLowerCase().trim())
                .filter((name) => name.length > 0)
        );
    }, [ingredients]);

    // 오늘의 추천 레시피 정렬: 1순위 임박재료 포함, 2순위 일치율(match), 3순위 인기순(heart)
    const sortedRecipes = useMemo(() => {
        // 임박 재료 포함 여부를 레시피마다 한 번만 계산해 둔다(정렬 비교 중 반복 계산 방지).
        const usesUrgentIngredient = (r: any): boolean => {
            if (urgentIngredientNameSet.size === 0) return false;
            const allIngs: any[] = [...(r.mustIngredients || []), ...(r.selectIngredients || [])];
            return allIngs.some((ing: any) => {
                const ingName = (ing.name || "").toLowerCase().trim();
                if (!ingName) return false;
                for (const urgentName of urgentIngredientNameSet) {
                    // 부분 일치도 허용 (예: "대파" vs "파")
                    if (ingName.includes(urgentName) || urgentName.includes(ingName)) return true;
                }
                return false;
            });
        };

        const flagged = recipes.map((r) => ({ recipe: r, urgent: usesUrgentIngredient(r) }));

        flagged.sort((a, b) => {
            // 1순위: 임박 재료를 포함한 레시피를 앞으로
            if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
            // 2순위: 일치율 높은 순 (비로그인/미계산 시 0)
            const matchDiff = (b.recipe.match ?? 0) - (a.recipe.match ?? 0);
            if (matchDiff !== 0) return matchDiff;
            // 3순위: 인기(좋아요) 높은 순
            return (b.recipe.heart ?? 0) - (a.recipe.heart ?? 0);
        });

        return flagged.map((x) => x.recipe);
    }, [recipes, urgentIngredientNameSet]);

    // 가장 인기 많은 레시피 (heart 기준 상위 1개)
    const popularRecipe = recipes.length > 0
        ? [...recipes].sort((a, b) => (b.heart ?? b.likeCount ?? 0) - (a.heart ?? a.likeCount ?? 0))[0]
        : null;


     const ScrapRecipe = recipes.length > 0
        ? [...recipes].sort((a, b) => (b.scrap ?? b.scrapCount ?? 0) - (a.scrap ?? a.scrapCount ?? 0))[0]
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
                    ScrapRecipe={ScrapRecipe}
                    urgentRecipe={urgentRecipe}
                />
                {!isAdmin && (
                    <>
                <AlertBar ingredients={ingredients} isLoggedIn={isLoggedIn} />
                <div className="bottom-grid">
                    <ExpiringIngredients ingredients={ingredients} isLoggedIn={isLoggedIn} />
                    <RecommendedRecipes recipes={sortedRecipes} isLoggedIn={isLoggedIn} />
                </div>
                </>
                )}

            {isAdmin && (
                <div className="admin-grid">
                    <AdminQna qnas={qnas} isLoggedIn={isLoggedIn} />
                    <AdminRecipe recipes={adminRecipes} isLoggedIn={isLoggedIn} />
                </div>
                )}
            </main>
            <footer className="imf-footer" />
        </div>
    );
};

export default MainPage;


