import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import type { Ingredient } from "../types/Fridge.ts";
import type { User } from "../types/User.ts";
import "../components/mainPage.css"; 

type Urgency = "urgent" | "warning" | "normal";

interface BannerItem {
    id: number;
    greeting: string;
    title: React.ReactNode;
    sub: string;
}

const CATEGORIES = ["전체", "한식", "양식", "일식", "중식", "간식", "야식", "다이어트", "밀프랩"] as const;

// 하위 컴포넌트 1: 오토 슬라이드 히어로 배너
interface HeroCardProps {
    userName: string;
    totalCount: number;
    urgentCount: number;
    recommendRecipe: number;
}

const HeroCard: React.FC<HeroCardProps> = ({ userName, totalCount, urgentCount, recommendRecipe }) => {
    const banners: BannerItem[] = [
        { id: 0, greeting: `안녕하세요, ${userName}님`, title: <>냉장고 속 재료로<br />무엇을 만들어볼까요?</>, sub: "냉장고 속 재료를 최대한 활용한 맞춤형 레시피를 추천해드려요." },
        { id: 1, greeting: "요리 팁", title: <>맛있는 <br />요리</>, sub: "냉장고 속 재료를 최대한 활용한 맞춤형 레시피를 추천해드려요." },
        { id: 2, greeting: "요리고수", title: <>재밌는<br />요리</>, sub: "냉장고 속 재료를 최대한 활용한 맞춤형 레시피를 추천해드려요." }
    ];

    const slideCount = banners.length;
    const extendedBanners = [banners[slideCount - 1], ...banners, banners[0]];

    const [currentIndex, setCurrentIndex] = useState(1);
    const [isTransition, setIsTransition] = useState(true);
    const [isSliding, setIsSliding] = useState(false);  

    const moveSlide = (targetIndex: number) => {
        if (isSliding) return; 
        setIsSliding(true); 
        setIsTransition(true);
        setCurrentIndex(targetIndex);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            if (!isSliding) {
                moveSlide(currentIndex + 1);
            }
        }, 5000);
        return () => clearInterval(timer);
    }, [currentIndex, isSliding]);

    const handleTransitionEnd = () => {
        setIsSliding(false); 
        if (currentIndex === slideCount + 1) {
            setIsTransition(false);
            setCurrentIndex(1); 
        }
        else if (currentIndex === 0) {
            setIsTransition(false);
            setCurrentIndex(slideCount); 
        }
    };

    const getDotActiveIndex = () => {
        if (currentIndex === 0) return slideCount - 1;
        if (currentIndex === slideCount + 1) return 0;
        return currentIndex - 1;
    };

    return (
        <div className="hero-card">
            <div className="hero-carousel-container">
                <div 
                    className="hero-carousel-track" 
                    style={{ 
                        transform: `translateX(-${currentIndex * 100}%)`,
                        transition: isTransition ? "transform 0.35s ease-in-out" : "none" 
                    }}
                    onTransitionEnd={handleTransitionEnd}
                >
                    {extendedBanners.map((banner, index) => (
                        <div className="hero-carousel-slide" key={`${banner.id}-${index}`}>
                            <div className="hero-text">
                                <p className="hero-greeting">{banner.greeting}</p>
                                <h1 className="hero-title">{banner.title}</h1>
                                <p className="hero-sub">{banner.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="carousel-page-dots">
                {banners.map((_, idx) => (
                    <span 
                        key={idx} 
                        className={`carousel-dot ${getDotActiveIndex() === idx ? "active" : ""}`} 
                        onClick={() => moveSlide(idx + 1)}
                    />
                ))}
            </div>
            
            <button className="carousel-nav-btn prev" onClick={() => moveSlide(currentIndex - 1)}>〈</button>
            <button className="carousel-nav-btn next" onClick={() => moveSlide(currentIndex + 1)}>〉</button>

            <div className="hero-stats">
                <div className="stat-box"><div className="num">{totalCount}</div><div className="label">보유 재료</div></div>
                <div className="stat-box"><div className="num urgent-highlight">{urgentCount}</div><div className="label">임박 재료</div></div>
                <div className="stat-box"><div className="num">{recommendRecipe}</div><div className="label">추천 레시피</div></div>
            </div>
        </div>
    );
};

// 하위 컴포넌트 2: 유통기한 알림 띠 바
interface AlertBarProps {
    ingredients: Ingredient[];
    isLoggedIn: boolean;
}

const AlertBar: React.FC<AlertBarProps> = ({ ingredients, isLoggedIn }) => {
    const navigate = useNavigate();
    const urgentItems = isLoggedIn ? ingredients.filter((i) => 
        (i.urgency === "urgent" || i.urgency === "warning") && i.dDay !== undefined && i.dDay >= 0
    ) : [];
    
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
            <span className="alert-link" onClick={() => navigate("/recipeMain", { state: { urgentOnly: true } })} 
                style={{ cursor: "pointer" }}>
                관련 레시피 보기 →
            </span>
        </div>
    );
};

// 하위 컴포넌트 3: 유통기한 임박 재료 리스트
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
                    <p style={{ textAlign: "center", color: "#999", padding: "1rem" }}>로그인 후 사용 가능합니다.</p>
                ) : ingredients.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#999", padding: "1rem" }}>임박 재료가 없습니다.</p>
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

// 하위 컴포넌트 4
interface RecommendedRecipesProps {
    recipes: any[];
    isLoggedIn: boolean;
}

const RecommendedRecipes: React.FC<RecommendedRecipesProps> = ({ recipes, isLoggedIn }) => {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState<string>("전체");
    const [query, setQuery] = useState<string>("");

    const categoryMap: Record<string, string> = {
        "한식": "KOR", "일식": "JAN", "중식": "CHN", "양식": "YANG",
        "간식": "GAN", "야식": "YA", "다이어트": "DIET", "밀프랩": "RAP"
    };

    const visibleRecipes = useMemo(() => {
        return recipes.filter((r) => {
            if (activeCategory !== "전체") {
                const targetBackendCode = categoryMap[activeCategory];
                if (r.category !== targetBackendCode) return false;
            }
            if (query.trim()) {
                const q = query.toLowerCase();
                const titleMatch = r.title?.toLowerCase().includes(q);
                const tagMatch = Array.isArray(r.tags) && r.tags.some((t: string) => t.toLowerCase().includes(q));
                const mustMatch = Array.isArray(r.mustIngredients) && r.mustIngredients.some((ing: any) =>
                    ing.name?.toLowerCase().includes(q)
                );
               const selectMatch = Array.isArray(r.selectIngredients) && r.selectIngredients.some((ing: any) =>
                    ing.name?.toLowerCase().includes(q)
                );
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
                <input type="text" placeholder="재료 이름이나 레시피를 검색하세요..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="category-tabs">
                {CATEGORIES.map((cat) => (
                    <button key={cat} type="button" className={`cat-tab ${activeCategory === cat ? "active" : ""}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
                ))}
            </div>
            <div className="recipe-list">
                {visibleRecipes.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#999", padding: "2rem" }}>조건에 맞는 추천 레시피가 없습니다.</p>
                ) : (
                    visibleRecipes.map((recipe) => (
                        <div className="recipe-item" key={recipe.id} onClick={() => navigate(`/recipeMain/${recipe.id}`)} style={{ cursor: "pointer" }}>
                            <div className="recipe-icon" style={{ background: recipe.iconBg || "#f1f5f9" }}>{recipe.icon || "🍽️"}</div>
                            <div className="recipe-info">
                                <div className="recipe-name">{recipe.title}</div>
                                <div className="recipe-tags">{recipe.tags?.slice(0, 3).map((tag: string) => <span className="recipe-tag" key={tag}>{tag}</span>)}</div>
                            </div>
                            {isLoggedIn ? (
                                <span className="recipe-match" style={{ color: "#6fbc44", fontWeight: "bold" }}>일치율 {recipe.match ?? 0}%</span>
                            ) : (
                                <span className="recipe-match" style={{ color: "#ef4444" }}>❤️ {recipe.heart ?? 0}</span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// 메인 컴포넌트 
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
                const response = await axiosInstance.get<any[]>('/recipeMain');
                let mapped = response.data || [];
console.log("🔥 백엔드가 실제로 던져준 레시피 알맹이 구조:", response.data?.[0]);
                mapped = mapped.map((r: any) => ({
                    ...r,
                    title: r.title || r.name || "이름 없는 레시피",
                    heart: r.heart !== undefined ? r.heart : (r.likes || r.likeCount || r.viewCount || 0)
                }));

                if (isLoggedIn) {
                    try {
                        const matchRes = await axiosInstance.get('/recipeMain/match');
                        if (Array.isArray(matchRes.data)) {
                            const rateMap = new Map<number, number>(
                                matchRes.data.map((m: any) => [m.id, m.matchRate ?? 0])
                            );
                            mapped.forEach(r => {
                                if (rateMap.has(r.id)) r.match = rateMap.get(r.id)!;
                            });
                        }
                    } catch (matchErr) {
                        console.error('메인페이지 매칭률 연동 실패:', matchErr);
                    }
                }

                if (isLoggedIn) {
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

        const user: User = JSON.parse(stored);
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
                        urgency: item.urgency || "normal"
                    };
                });

                setUrgentCount(processed.filter(i => 
                    (i.urgency === "urgent" || i.urgency === "warning") && (i.dDay !== undefined && i.dDay >= 0)
                ).length);

                const finalMainList = processed
                    .filter(i => 
                        (i.urgency === "urgent" || i.urgency === "warning") && (i.dDay !== undefined && i.dDay >= 0)
                    )
                    .sort((a, b) => (a.dDay ?? 0) - (b.dDay ?? 0))
                    .slice(0, 5);

                setIngredients(finalMainList);
            })
            .catch((err) => console.error("데이터 연동 실패:", err));
    }, []);

    return (
        <div className="imf-root">
            <main className="imf-main">
                <HeroCard userName={userName} totalCount={totalCount} urgentCount={urgentCount} recommendRecipe={recommendRecipe}/>
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