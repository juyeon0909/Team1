import React, { useEffect, useState } from "react";
import "../components/mainPage.css"; 
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import type { Ingredient } from "../types/Fridge.ts";
import type { User } from "../types/User.ts";

type Urgency = "urgent" | "warning" | "normal";

// 레시피 인터페이스 (임시)
interface Recipe {
    id: number;
    name: string;
    icon: string;
    iconBg: string;
    tags: string[];
    matchText: string;
    category: string;
}

// 술라이드 박스용 로컬 인터페이스
interface BannerItem {
    id: number;
    greeting: string;
    title: React.ReactNode;
    sub: string;
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
    
    const banners: BannerItem[] = [
        { id: 0, greeting: `안녕하세요, ${userName}님`, title: <>냉장고 속 재료로<br />무엇을 만들어볼까요?</>, sub: "냉장고 속 재료를 최대한 활용한 맞춤형 레시피를 추천해드려요." },
        { id: 1, greeting: "요리 팁", title: <>맛있는 <br />요리</>, sub: "냉장고 속 재료를 최대한 활용한 맞춤형 레시피를 추천해드려요." },
        { id: 2, greeting: "요리고수", title: <>재밌는<br />요리</>, sub: "냉장고 속 재료를 최대한 활용한 맞춤형 레시피를 추천해드려요." }
    ];

    const slideCount = banners.length;

    // 무한 루프: [마지막 카피] - [1] - [2] - [3] - [첫번째 카피] 구조로 기차 연결
    const extendedBanners = [
        banners[slideCount - 1], // 인덱스 0: 3번 배너의 가짜 카피
        ...banners,              // 인덱스 1, 2, 3: 진짜 배너들
        banners[0]               // 인덱스 4: 1번 배너의 가짜 카피
    ];

    // 시작 위치 1번 배너 
    const [currentIndex, setCurrentIndex] = useState(1);
    const [isTransition, setIsTransition] = useState(true);
    const [isSliding, setIsSliding] = useState(false);  
    // 공통 이동 제어 함수

    const moveSlide = (targetIndex: number) => {
        if (isSliding) return; // 🌟 이동 중일 때는 화살표 클릭 입력을 칼같이 씹어버림!
        
        setIsSliding(true); // 이동 시작 마킹
        setIsTransition(true);
        setCurrentIndex(targetIndex);
    };

    // 오토 슬라이드 타이머 (5초마다 오른쪽 칸으로 전진)
    useEffect(() => {
        const timer = setInterval(() => {
            // 오토 슬라이드 작동 시에도 sliding 상태가 아닐 때만 전진
            if (!isSliding) {
                moveSlide(currentIndex + 1);
            }
        }, 5000);
        return () => clearInterval(timer);
    }, [currentIndex, isSliding]);

    // 애니메이션이 끝난 직후 순간이동 처리
    const handleTransitionEnd = () => {
        setIsSliding(false); // 🌟 애니메이션이 무사히 끝났으므로 락(Lock) 해제
        
        if (currentIndex === slideCount + 1) {
            setIsTransition(false);
            setCurrentIndex(1); // 가짜 1번에서 진짜 1번으로 워프
        }
        else if (currentIndex === 0) {
            setIsTransition(false);
            setCurrentIndex(slideCount); // 가짜 3번에서 진짜 3번으로 워프
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
                transition: isTransition ? "transform 0.35s ease-in-out" : "none"   // 메인 배너 슬라이드 속도 
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
            
            {/* 하단 점 내비게이션 */}
            <div className="carousel-page-dots">
              {banners.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`carousel-dot ${getDotActiveIndex() === idx ? "active" : ""}`} 
                  onClick={() => moveSlide(idx + 1)}
                />
              ))}
            </div>
          
                {/* 좌우 화살표 버튼 제어 */}
        <button className="carousel-nav-btn prev" onClick={() => moveSlide(currentIndex - 1)}>〈</button>
        <button className="carousel-nav-btn next" onClick={() => moveSlide(currentIndex + 1)}>〉</button>

          <div className="hero-stats">
            <div className="stat-box"><div className="num">{totalCount}</div><div className="label">보유 재료</div></div>
            <div className="stat-box"><div className="num urgent-highlight">{urgentCount}</div><div className="label">임박 재료</div></div>
            <div className="stat-box"><div className="num">24</div><div className="label">추천 레시피</div></div>
          </div>
        </div>
    );
};


//  하위 컴포넌트 2: 유통기한 알림 띠 바
   
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
            <span className="alert-link" onClick={() => navigate("/recipeMain", { state: { urgentOnly: true } })} style={{ cursor: "pointer" }}>
                관련 레시피 보기 →
            </span>
        </div>
    );
};

//    하위 컴포넌트 3: 유통기한 임박 재료 리스트
   
interface ExpiringIngredientsProps {
    ingredients: Ingredient[];
    loading: boolean;
    isLoggedIn: boolean;
}

const ExpiringIngredients: React.FC<ExpiringIngredientsProps> = ({ ingredients, loading, isLoggedIn }) => {
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
                ) : !isLoggedIn ? (
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


//    하위 컴포넌트 4: 오늘의 추천 레시피 구역
   
const RecommendedRecipes: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<string>("전체");
    const [query, setQuery] = useState<string>("");

    const visibleRecipes = activeCategory === "전체" ? RECIPES : RECIPES.filter((r) => r.category === activeCategory);

    return (
        <div className="section-card">
            <div className="section-header"><span className="section-title">오늘의 추천 레시피</span><button className="section-more" type="button">더 보기</button></div>
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


//    메인 컴포넌트 

const MainPage: React.FC = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("사용자");
    const [totalCount, setTotalCount] = useState(0);
    const [urgentCount, setUrgentCount] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) { setLoading(false); return; }

        const user: User = JSON.parse(stored);
        if (user.name) setUserName(user.name);
        setIsLoggedIn(true);
        
    //     axiosInstance.get<any[]>(`/product/list/${user.id}`)
    //         .then((res) => {
    //             const rawData = res.data || [];
    //             setTotalCount(rawData.length);

    //             const today = new Date();
    //             today.setHours(0, 0, 0, 0);

    //             const processed = rawData.map((item) => {
    //                 const targetDateStr = item.expirationdate || item.expiry;
    //                 let dDayResult = 999;
    //                 let urgencyResult: Urgency = "normal";

    //                 if (targetDateStr) {
    //                     const expDate = new Date(targetDateStr);
    //                     expDate.setHours(0, 0, 0, 0);
    //                     dDayResult = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        
    //                     if (dDayResult < 0) urgencyResult = "normal"; // 혹은 기한초과
    //                     else if (dDayResult <= 3) urgencyResult = "urgent";
    //                     else if (dDayResult <= 7) urgencyResult = "warning";
    //                 }

    //                 return {
    //                     ...item,
    //                     itemname: item.itemname || item.name || "이름 없음",
    //                     dDay: dDayResult,
    //                     urgency: urgencyResult
    //                 };
    //             });

    //             setUrgentCount(processed.filter(i => i.urgency === "urgent" || i.urgency === "warning").length);

    //             const finalMainList = processed
    //                 .filter(i => i.urgency === "urgent" || i.urgency === "warning")
    //                 .sort((a, b) => (a.dDay ?? 0) - (b.dDay ?? 0))
    //                 .slice(0, 5);  // 띠지 몇개까지 보이게 하고 싶은가

    //             setIngredients(finalMainList);
    //         })
    //         .catch((err) => console.error("데이터 연동 실패:", err))
    //         .finally(() => setLoading(false));
    // }, []);
axiosInstance.get<any[]>(`/product/list/${user.id}`)
            .then((res) => {
                const rawData = res.data || [];
                setTotalCount(rawData.length);

                // 🟢 백엔드에서 전송해주는 정제 필드(itemName, expirationDate, storageType, dDay, urgency)를 다이렉트로 매핑
                const processed = rawData.map((item) => {
                    const serverDday = item.dDay !== undefined ? item.dDay : item.dday;
                    return {
                        ...item,
                        // 만약 구형 백엔드 필드가 섞여들어와도 완벽 방어하는 2중 안전선 가동
                        // itemName: item.itemName || item.itemname || item.name || "이름 없음",
                        // storageType: item.storageType || item.storagetype || "REFRIGERATED",
                        // expirationDate: item.expirationDate || item.expirationdate || item.expiry,
                        // dDay: item.dDay !== undefined ? item.dDay : 999,
                        // urgency: item.urgency || "normal"
                        dDay: serverDday !== undefined ? serverDday : 999,
                        urgency: item.urgency || "normal"
                    };
                });

                // setUrgentCount(processed.filter(i => i.urgency === "urgent" || i.urgency === "warning").length);

                // const finalMainList = processed
                //     .filter(i => i.urgency === "urgent" || i.urgency === "warning")
                //     .sort((a, b) => (a.dDay ?? 0) - (b.dDay ?? 0))
                //     .slice(0, 5);  
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
            .catch((err) => console.error("데이터 연동 실패:", err))
            .finally(() => setLoading(false));
    }, []);




    return (
        <div className="imf-root">
            <main className="imf-main">
                <HeroCard userName={userName} totalCount={totalCount} urgentCount={urgentCount} />
                <AlertBar ingredients={ingredients} isLoggedIn={isLoggedIn} />
                <div className="bottom-grid">
                    <ExpiringIngredients ingredients={ingredients} loading={loading} isLoggedIn={isLoggedIn} />
                    <RecommendedRecipes />
                </div>
            </main>
            <footer className="imf-footer" />
        </div>
    );
};

/*커밋 체크*/
export default MainPage;