import '../components/mainPage.css'

function App() {
    console.log('자바스크립트 코딩 영역');

    return (
        <>
            <div className="page">

                <nav className="navbar">
                    <div className="nav-logo">
                        <i className="ti ti-fridge" aria-hidden="true"></i>
                        잇츠 인 마이 냉장고
                    </div>
                    <div className="nav-links">
                        <a className="nav-link active">홈</a>
                        <a className="nav-link">냉장고</a>
                        <a className="nav-link">레시피</a>
                    </div>
                    <div className="nav-right">
                        <i className="ti ti-bell" aria-hidden="true"></i>
                        <div className="avatar">김주</div>
                    </div>
                </nav>

                <div className="hero">
                    <div className="hero-left">
                        <div className="hero-greeting">안녕하세요, 김주연님! </div>
                        <div className="hero-title">오늘은 <span>두부</span>와 <span>계란</span>으로<br />무엇을 만들어볼까요?</div>
                        <div className="hero-desc">냉장고 속 재료를 최대한 활용한 레시피를 추천해드려요.</div>
                    </div>
                    <div className="hero-right">
                        <div className="stat-card">
                            <div className="stat-num">16</div>
                            <div className="stat-label">보유 재료</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-num">3</div>
                            <div className="stat-label">임박 재료</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-num">24</div>
                            <div className="stat-label">추천 레시피</div>
                        </div>
                    </div>
                </div>

                <div className="alert-strip">
                    <i className="ti ti-alert-triangle" aria-hidden="true"></i>
                    <div className="alert-strip-text">
                        오늘 소비가 권장되는 재료:
                        <span className="ing-pill pill-red">두부 D-1</span>
                        <span className="ing-pill pill-red">계란 D-2</span>
                        <span className="ing-pill pill-yellow">대파 D-5</span>
                        <span className="ing-pill pill-yellow">애호박 D-6</span>
                    </div>
                    <span className="alert-strip-link">관련 레시피 보기 →</span>
                </div>

                <div className="main">

                    <div>
                        <div className="section-header">
                            <div className="section-title">
                                <i className="ti ti-clock-exclamation" aria-hidden="true"></i>
                                유통기한 임박 재료
                            </div>
                            <span className="see-all">전체 보기 <i className="ti ti-arrow-right"></i></span>
                        </div>
                        <div className="expiry-grid">
                            <div className="expiry-card danger">
                                <div className="exp-top">
                                    <span className="exp-badge danger">D-1</span>
                                    <span className="exp-storage">냉장</span>
                                </div>
                                <div className="exp-name">두부</div>
                                <div className="exp-qty">1/2 모</div>
                                <div className="exp-bar-wrap"><div className="exp-bar danger" style={{ width: '10%' }}></div></div>
                            </div>
                            <div className="expiry-card danger">
                                <div className="exp-top">
                                    <span className="exp-badge danger">D-2</span>
                                    <span className="exp-storage">냉장</span>
                                </div>
                                <div className="exp-name">계란</div>
                                <div className="exp-qty">4 개</div>
                                <div className="exp-bar-wrap"><div className="exp-bar danger" style={{ width: '20%' }}></div></div>
                            </div>
                            <div className="expiry-card warn">
                                <div className="exp-top">
                                    <span className="exp-badge warn">D-5</span>
                                    <span className="exp-storage">냉장</span>
                                </div>
                                <div className="exp-name">대파</div>
                                <div className="exp-qty">1 단</div>
                                <div className="exp-bar-wrap"><div className="exp-bar warn" style={{ width: '45%' }}></div></div>
                            </div>
                            <div className="expiry-card warn">
                                <div className="exp-top">
                                    <span className="exp-badge warn">D-6</span>
                                    <span className="exp-storage">냉장</span>
                                </div>
                                <div className="exp-name">애호박</div>
                                <div className="exp-qty">1 개</div>
                                <div className="exp-bar-wrap"><div className="exp-bar warn" style={{ width: '55%' }}></div></div>
                            </div>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div>
                        <div className="section-header">
                            <div className="section-title">
                                <i className="ti ti-sparkles" aria-hidden="true"></i>
                                오늘의 추천 레시피
                            </div>
                            <span className="see-all">더 보기 <i className="ti ti-arrow-right"></i></span>
                        </div>

                        <div className="search-row" style={{ marginBottom: '14px' }}>
                            <div className="search-box">
                                <i className="ti ti-search" aria-hidden="true"></i>
                                <input type="text" placeholder="재료 이름이나 레시피를 검색하세요..." />
                            </div>
                        </div>

                        <div className="filter-chips" style={{ marginBottom: '16px' }}>
                            <div className="chip active">전체</div>
                            <div className="chip">한식</div>
                            <div className="chip">양식</div>
                            <div className="chip">일식</div>
                            <div className="chip">중식</div>
                            <div className="chip">다이어트</div>
                            <div className="chip">간식</div>
                            <div className="chip">야식</div>
                        </div>

                        <div className="recipe-grid">
                            <div className="recipe-card">
                                <div className="recipe-thumb t1">🍳</div>
                                <div className="recipe-body">
                                    <div className="recipe-match-row">
                                        <span className="match-badge match-100">재료 일치 100%</span>
                                    </div>
                                    <div className="recipe-name">두부 계란찜</div>
                                    <div className="recipe-meta">
                                        <span><i className="ti ti-clock"></i> 15분</span>
                                        <span><i className="ti ti-heart"></i> 234</span>
                                        <span><i className="ti ti-star"></i> 4.8</span>
                                    </div>
                                    <div className="recipe-tags">
                                        <span className="rtag">한식</span>
                                        <span className="rtag">초간단</span>
                                    </div>
                                </div>
                            </div>
                            <div className="recipe-card">
                                <div className="recipe-thumb t2">🥘</div>
                                <div className="recipe-body">
                                    <div className="recipe-match-row">
                                        <span className="match-badge match-hi">재료 일치 85%</span>
                                    </div>
                                    <div className="recipe-name">대파 된장찌개</div>
                                    <div className="recipe-meta">
                                        <span><i className="ti ti-clock"></i> 20분</span>
                                        <span><i className="ti ti-heart"></i> 189</span>
                                        <span><i className="ti ti-star"></i> 4.6</span>
                                    </div>
                                    <div className="recipe-tags">
                                        <span className="rtag">한식</span>
                                        <span className="rtag">국물</span>
                                    </div>
                                </div>
                            </div>
                            <div className="recipe-card">
                                <div className="recipe-thumb t3">🍜</div>
                                <div className="recipe-body">
                                    <div className="recipe-match-row">
                                        <span className="match-badge match-mid">재료 일치 70%</span>
                                    </div>
                                    <div className="recipe-name">애호박 볶음밥</div>
                                    <div className="recipe-meta">
                                        <span><i className="ti ti-clock"></i> 10분</span>
                                        <span><i className="ti ti-heart"></i> 412</span>
                                        <span><i className="ti ti-star"></i> 4.7</span>
                                    </div>
                                    <div className="recipe-tags">
                                        <span className="rtag">한식</span>
                                        <span className="rtag">간편식</span>
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