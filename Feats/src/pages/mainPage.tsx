function App() {
    console.log('자바스크립트 코딩 영역');

    return (
        <>
            <div class="page">

                <nav class="navbar">
                    <div class="nav-logo">
                        <i class="ti ti-fridge" aria-hidden="true"></i>
                        잇츠 인 마이 냉장고
                    </div>
                    <div class="nav-links">
                        <a class="nav-link active">홈</a>
                        <a class="nav-link">냉장고</a>
                        <a class="nav-link">레시피</a>
                        <a class="nav-link">스크랩</a>
                    </div>
                    <div class="nav-right">
                        <i class="ti ti-bell" aria-hidden="true"></i>
                        <div class="avatar">김주</div>
                    </div>
                </nav>

                <div class="hero">
                    <div class="hero-left">
                        <div class="hero-greeting">안녕하세요, 김주연님 👋</div>
                        <div class="hero-title">오늘은 <span>두부</span>와 <span>계란</span>으로<br>무엇을 만들어볼까요?</div>
                        <div class="hero-desc">냉장고 속 재료를 최대한 활용한 레시피를 추천해드려요.</div>
                    </div>
                    <div class="hero-right">
                        <div class="stat-card">
                            <div class="stat-num">16</div>
                            <div class="stat-label">보유 재료</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-num">3</div>
                            <div class="stat-label">임박 재료</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-num">24</div>
                            <div class="stat-label">추천 레시피</div>
                        </div>
                    </div>
                </div>

                <div class="alert-strip">
                    <i class="ti ti-alert-triangle" aria-hidden="true"></i>
                    <div class="alert-strip-text">
                        오늘 소비가 권장되는 재료:
                        <span class="ing-pill pill-red">두부 D-1</span>
                        <span class="ing-pill pill-red">계란 D-2</span>
                        <span class="ing-pill pill-yellow">대파 D-5</span>
                        <span class="ing-pill pill-yellow">애호박 D-6</span>
                    </div>
                    <span class="alert-strip-link">관련 레시피 보기 →</span>
                </div>

                <div class="main">

                    <div>
                        <div class="section-header">
                            <div class="section-title">
                                <i class="ti ti-clock-exclamation" aria-hidden="true"></i>
                                유통기한 임박 재료
                            </div>
                            <span class="see-all">전체 보기 <i class="ti ti-arrow-right"></i></span>
                        </div>
                        <div class="expiry-grid">
                            <div class="expiry-card danger">
                                <div class="exp-top">
                                    <span class="exp-badge danger">D-1</span>
                                    <span class="exp-storage">냉장</span>
                                </div>
                                <div class="exp-name">두부</div>
                                <div class="exp-qty">1/2 모</div>
                                <div class="exp-bar-wrap"><div class="exp-bar danger" style="width:10%"></div></div>
                            </div>
                            <div class="expiry-card danger">
                                <div class="exp-top">
                                    <span class="exp-badge danger">D-2</span>
                                    <span class="exp-storage">냉장</span>
                                </div>
                                <div class="exp-name">계란</div>
                                <div class="exp-qty">4 개</div>
                                <div class="exp-bar-wrap"><div class="exp-bar danger" style="width:20%"></div></div>
                            </div>
                            <div class="expiry-card warn">
                                <div class="exp-top">
                                    <span class="exp-badge warn">D-5</span>
                                    <span class="exp-storage">냉장</span>
                                </div>
                                <div class="exp-name">대파</div>
                                <div class="exp-qty">1 단</div>
                                <div class="exp-bar-wrap"><div class="exp-bar warn" style="width:45%"></div></div>
                            </div>
                            <div class="expiry-card warn">
                                <div class="exp-top">
                                    <span class="exp-badge warn">D-6</span>
                                    <span class="exp-storage">냉장</span>
                                </div>
                                <div class="exp-name">애호박</div>
                                <div class="exp-qty">1 개</div>
                                <div class="exp-bar-wrap"><div class="exp-bar warn" style="width:55%"></div></div>
                            </div>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <div>
                        <div class="section-header">
                            <div class="section-title">
                                <i class="ti ti-sparkles" aria-hidden="true"></i>
                                오늘의 추천 레시피
                            </div>
                            <span class="see-all">더 보기 <i class="ti ti-arrow-right"></i></span>
                        </div>

                        <div class="search-row" style="margin-bottom:14px;">
                            <div class="search-box">
                                <i class="ti ti-search" aria-hidden="true"></i>
                                <input type="text" placeholder="재료 이름이나 레시피를 검색하세요..." />
                            </div>
                        </div>

                        <div class="filter-chips" style="margin-bottom:16px;">
                            <div class="chip active">전체</div>
                            <div class="chip">한식</div>
                            <div class="chip">양식</div>
                            <div class="chip">일식</div>
                            <div class="chip">중식</div>
                            <div class="chip">다이어트</div>
                            <div class="chip">간식</div>
                            <div class="chip">야식</div>
                        </div>

                        <div class="recipe-grid">
                            <div class="recipe-card">
                                <div class="recipe-thumb t1">🍳</div>
                                <div class="recipe-body">
                                    <div class="recipe-match-row">
                                        <span class="match-badge match-100">재료 일치 100%</span>
                                    </div>
                                    <div class="recipe-name">두부 계란찜</div>
                                    <div class="recipe-meta">
                                        <span><i class="ti ti-clock"></i> 15분</span>
                                        <span><i class="ti ti-heart"></i> 234</span>
                                        <span><i class="ti ti-star"></i> 4.8</span>
                                    </div>
                                    <div class="recipe-tags">
                                        <span class="rtag">한식</span>
                                        <span class="rtag">초간단</span>
                                    </div>
                                </div>
                            </div>
                            <div class="recipe-card">
                                <div class="recipe-thumb t2">🥘</div>
                                <div class="recipe-body">
                                    <div class="recipe-match-row">
                                        <span class="match-badge match-hi">재료 일치 85%</span>
                                    </div>
                                    <div class="recipe-name">대파 된장찌개</div>
                                    <div class="recipe-meta">
                                        <span><i class="ti ti-clock"></i> 20분</span>
                                        <span><i class="ti ti-heart"></i> 189</span>
                                        <span><i class="ti ti-star"></i> 4.6</span>
                                    </div>
                                    <div class="recipe-tags">
                                        <span class="rtag">한식</span>
                                        <span class="rtag">국물</span>
                                    </div>
                                </div>
                            </div>
                            <div class="recipe-card">
                                <div class="recipe-thumb t3">🍜</div>
                                <div class="recipe-body">
                                    <div class="recipe-match-row">
                                        <span class="match-badge match-mid">재료 일치 70%</span>
                                    </div>
                                    <div class="recipe-name">애호박 볶음밥</div>
                                    <div class="recipe-meta">
                                        <span><i class="ti ti-clock"></i> 10분</span>
                                        <span><i class="ti ti-heart"></i> 412</span>
                                        <span><i class="ti ti-star"></i> 4.7</span>
                                    </div>
                                    <div class="recipe-tags">
                                        <span class="rtag">한식</span>
                                        <span class="rtag">간편식</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default App;