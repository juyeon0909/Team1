import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import type { Recipe } from '../types/Recipe';
import type { User } from '../types/User';
import customAxios from './../api/axiosInstance';
import axios from "axios";

import { API_BASE_URL } from "../config/config";

import Paging from "./paging";

import FieldSearch from './FieldSearch';

import { initialPagingInfo, type PagingInfo } from "../types/Paging";

import { initialSearchCondition, type SearchCondition } from '../types/SearchCondition';
import Button from 'react-bootstrap/esm/Button';

type ProductProps = { // user: User는 자바의 객체: 클래스 정도로 이해하면 됨
    user: User | null; // 로그인하면 의미 있는 객체, 아니면 null
};

function RecipeMain({ user }: ProductProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: urlId } = useParams();

  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const view = urlId ? 'detail' : 'list';
  const selectedRecipeId = urlId ? parseInt(urlId, 10) : null;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mustIngredients, setMustIngredients] = useState<{ name: string; quantity: string }[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('추천순');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [activeMatch, setActiveMatch] = useState('전체');
  const [activeTime, setActiveTime] = useState('전체');
  const [urgentOnly, setUrgentOnly] = useState(false);

  // 관련 스테이트 정의 (ts.가져오기)
    const [paging, setPaging] = useState<PagingInfo>(initialPagingInfo);

    // 2) 관련 스테이트 정의
    const [searchCondition, setSearchCondition] = useState<SearchCondition>(initialSearchCondition);



  useEffect(() => {
    const url = `${API_BASE_URL}/recipeMain`;


      // 페이징 처리 관련 parameters 항목을 추가함
    const parameters = {
        params: {
            pageNumber: paging.pageNumber,
            pageSize: paging.pageSize,

            // 3) useEffect() Hook 수정 : 검색 관련 항목들을 parameters 항목에 추가합니다.
            // 검색 조건들
            searchDateType: searchCondition.searchDateType,
            category: searchCondition.category,
            searchMode: searchCondition.searchMode,
            searchKeyword: searchCondition.searchKeyword
        }
    }

    customAxios.get(url, parameters)
            .then((response) => {
                console.log('응답 받은 데이터');

                // setRecipes() 메소드 수정 - 응답 받은 데이터 response.data → response.data.content으로 수정
                console.log(response.data.content);
                setRecipes(response.data.content || []);

                // then() 구문 하단 - setPaging() 메소드를 사용한 paging 업데이트하기
                setPaging((prev) => {
                    // pageable (스프링에 들어있는 인터페이스) : 항목의 수를 반환?해주는?
                    const { totalElements, totalPages, pageable } = response.data;

                    // pageable이라는 데이터가 정상적으로 안들어와도 돌아가게 안전빵으로 ?하나 주기
                    // ??(물음표 2개)의 의미 : 왼쪽 데이터가 null이거나 undefined이면 오른쪽 데이터로 설정해라
                    const pageNumber = pageable?.pageNumber ?? 0;
                    const pageSize = pageable?.pageSize ?? prev.pageSize;

                    // Math.floor는 소수점을 버리는 함수임
                    // 현재 페이지가 속한 그룹의 시작 번호(beginPage) 계산하는 방법
                    const beginPage = Math.floor(pageNumber / prev.pageCount) * prev.pageCount;

                    // 현재 페이지가 속한 그룹의 끝 번호(endpage) 계산하는 방법
                    //const endPage = beginPage + prev.pageCount - 1 ;
                    // 그러나 이렇게 endPage를 계산했을때 totalPages보다 endPage가 커지는 경우도 발생함
                    // 따라서 2개의 옵션을 주고 그것에 대한 최솟값을 endPage에 적용함
                    const endPage = Math.min(
                        beginPage + prev.pageCount - 1,
                        totalPages - 1
                    );

                    // 삼항연산자 사용
                    const pagingStatus =
                        totalPages === 0
                            ? "0/0 페이지"
                            : `${pageNumber + 1}/${totalPages} 페이지`;


                    return {
                        ...prev,
                        totalElements,
                        totalPages,
                        pageNumber,
                        pageSize,
                        beginPage,
                        endPage,
                        pagingStatus
                    };
                });

            })
            .catch((error) => {
                console.log(error);
            }); // 두 번째 매개 변수에 paging.pageNumber를 추가합니다.
        // 3) useEffect() Hook 수정 : 두 번째 매개 변수에 searchCondition 연관 항목들을 추가합니다.
    }, [
        paging.pageNumber,
        searchCondition.searchDateType,
        searchCondition.category,
        searchCondition.searchMode,
        searchCondition.searchKeyword
    ]);


    const makeAdminButtons = (item: Recipe, user: User | null, navigate: any) => {
        if (user?.role !== 'ADMIN') return null;

        return (
            <div className="d-flex justify-content-center">
                <Button // 수정을 위한 <Button>을 추가합니다.
                    variant="warning"
                    className="mb-2"
                    size="sm"
                    onClick={(event) => {
                        event.stopPropagation(); // 이벤트 버블링 방지
                        navigate(`/product/update/${item.id}`); // 유일한 id가 있음
                    }}>
                    수정
                </Button>

                &nbsp;

                <Button // 삭제를 위한 <Button>을 추가합니다. (confirm 함수 이용)(alert과는 다름)
                    variant="danger"
                    className="mb-2"
                    size="sm"
                    onClick={async (event) => {
                        event.stopPropagation(); // 이벤트 버블링 방지

                        const isDelete = window.confirm(`${item.name} 레시피를 삭제하시겠습니까?`);

                        if (isDelete === false) {
                            /* sweet alert2 사이트에 이쁜거 많음 */
                            alert(`${item.name} 레시피 삭제를 취소하였습니다.`)
                            return;
                        }

                        try { // 전체 배열에서 일부 데이터만 필터할 수 있음
                            const url = `${API_BASE_URL}/recipe/delete/${item.id}`;
                            await axios.delete(url);
                            alert(`'${item.name}' 레시피가 삭제되었습니다.`)

                            // 레시피를 갱신해주는 setter
                            // 이전(prev) 레시피 정보를 가져와서 필터링하는데
                            // 이전 레시피의 id와 해당 레시피 id가 같지 않으면 - 레시피 데이터에 해당 레시피가 없으면
                            // 레시피(목록)을 갱신해라
                            setRecipes(prev => prev.filter(r => r.id !== item.id));

                            navigate('/recipe/list');

                        } catch (error) {
                            console.log(error);
                            if (axios.isAxiosError(error)) {
                                alert(`레시피 삭제 실패 : ${error.response?.data || error.message}`);
                            } else {
                                console.log('알수 없는 에러 : ' + error);
                            }
                        };
                    }}>
                    삭제
                </Button>
            </div>
        );
    };


  useEffect(() => {
    const localData = localStorage.getItem('user_recipes');
    if (localData) setRecipes(JSON.parse(localData));
  }, [location.pathname]);

  useEffect(() => {
    if (location.state && location.state.newRecipe) {
      const incomingData = location.state.newRecipe;
      setRecipes(prevRecipes => {
        const localData = localStorage.getItem('user_recipes');
        const currentList: Recipe[] = localData ? JSON.parse(localData) : prevRecipes;
        const nextId = currentList.length > 0 ? Math.max(...currentList.map(r => r.id)) + 1 : 1;
        const completedRecipe: Recipe = {
          ...incomingData,
          id: nextId,
          heart: incomingData.heart ?? 0,
          star: incomingData.star ?? 0,
          isHearted: false,
          isScrapped: false,
          match: incomingData.match ?? 100,
          bg: incomingData.bg || '#E1F5EE',
          emoji: incomingData.emoji || '🍳'
        };
        return [completedRecipe, ...currentList];
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    localStorage.setItem('user_recipes', JSON.stringify(recipes));
  }, [recipes]);

  const toggleHeart = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, isHearted: !r.isHearted, heart: !r.isHearted ? r.heart + 1 : Math.max(0, r.heart - 1) } : r));
  };

  const toggleScrap = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, isScrapped: !r.isScrapped, star: !r.isScrapped ? r.star + 1 : Math.max(0, r.star - 1) } : r));
  };

  const filteredRecipes = useMemo(() => {
    let result = recipes.filter(r => {
      if (urgentOnly && !r.urgent) return false;
      if (activeCategory !== '전체' && r.cat !== activeCategory) return false;
      if (activeMatch === '100' && r.match < 100) return false;
      if (activeMatch === '70' && r.match < 70) return false;
      if (activeMatch === '50' && r.match < 50) return false;
      if (activeTime === '15' && r.time > 15) return false;
      if (activeTime === '30' && r.time > 30) return false;
      if (activeTime === '60' && r.time > 60) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    });
    if (sortBy === '추천순') result.sort((a, b) => b.match - a.match);
    if (sortBy === '인기순') result.sort((a, b) => b.heart - a.heart);
    if (sortBy === '최신순') result.sort((a, b) => b.id - a.id);
    if (sortBy === '리뷰순') result.sort((a, b) => b.star - a.star);
    return result;
  }, [recipes, searchQuery, activeCategory, activeMatch, activeTime, urgentOnly, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / perPage));
  const pagedRecipes = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredRecipes.slice(start, start + perPage);
  }, [filteredRecipes, currentPage]);

  const handleCookStart = () => {
    if (selectedRecipeId) {
      setRecipes(prev => prev.map(r => r.id === selectedRecipeId ? { ...r, mustIngredients: mustIngredients.map(item => ({ ...item })) } : r));
    }
    alert('요리를 시작합니다! 메인 목록으로 돌아갑니다.');
    setIsModalOpen(false);
    navigate('/recipeMain');
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updated = [...mustIngredients];
    updated[index] = { ...updated[index], quantity: value };
    setMustIngredients(updated);
  };

  const getMatchBadgeStyle = (match: number) => {
    if (match >= 100) return { bg: '#6FBC44', text: '#fff' };  // ← 변경
    if (match >= 80)  return { bg: '#3E8C1F', text: '#fff' };  // ← 변경
    return { bg: '#BA7517', text: '#fff' };
  };

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f8f9fa', minHeight: '100vh', color: '#111', position: 'relative' }}>

      {/* ─── 목록 화면 ─── */}
      {view === 'list' && (
        <div>
          <div style={{ background: '#fff', borderBottom: '0.5px solid #eee', padding: '24px 40px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '20px', fontWeight: 500 }}>레시피</div>
              <button
                style={{ background: '#6FBC44', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                onClick={() => navigate('/recipeMain/register')}
              >
                레시피 등록
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, background: '#fafafa', border: '0.5px solid #ccc', borderRadius: '8px', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="레시피 이름 또는 재료로 검색..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', width: '100%' }}
                />
              </div>
              <select
                style={{ fontSize: '13px', color: '#555', border: '0.5px solid #ccc', borderRadius: '6px', padding: '8px 12px', background: '#fff', cursor: 'pointer' }}
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              >
                <option>추천순</option><option>최신순</option><option>인기순</option><option>리뷰순</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
              {['전체', '한식', '양식', '일식', '중식', '간식'].map(cat => (
                <div
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setCurrentPage(1); }}
                  style={{
                    fontSize: '13px', padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap',
                    color: activeCategory === cat ? '#3E8C1F' : '#666',
                    fontWeight: activeCategory === cat ? 500 : 'normal',
                    borderBottom: activeCategory === cat ? '2px solid #6FBC44' : '2px solid transparent'
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '28px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', color: '#555' }}>
                <strong style={{ color: '#111', fontWeight: 500 }}>{filteredRecipes.length}개</strong>의 레시피
              </div>
              <div
                onClick={() => { setUrgentOnly(!urgentOnly); setCurrentPage(1); }}
                style={{ fontSize: '12px', color: '#791F1F', background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '20px', padding: '5px 12px', cursor: 'pointer' }}
              >
                {urgentOnly ? '전체 레시피 보기' : '임박 재료 레시피만 보기'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {pagedRecipes.map(r => {
                const badge = getMatchBadgeStyle(r.match);
                return (
                  <div
                    key={r.id}
                    onClick={() => navigate(`/recipeMain/${r.id}`)}
                    style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    <div style={{ height: '130px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', position: 'relative' }}>
                      {r.emoji}
                      <span style={{ position: 'absolute', bottom: '8px', right: '8px', fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: badge.bg, color: badge.text }}>
                        {r.match}% 일치
                      </span>
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#111', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#3E8C1F', background: '#E8F5DA', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>{r.cat}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', height: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.desc}</div>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#999' }}>
                        <span>⏱️ {r.time}분</span>
                        <span onClick={(e) => toggleHeart(r.id, e)} style={{ cursor: 'pointer', color: r.isHearted ? '#E05D5D' : '#999' }}>
                          {r.isHearted ? '❤️' : '🤍'} {r.heart}
                        </span>
                        <span onClick={(e) => toggleScrap(r.id, e)} style={{ cursor: 'pointer', color: r.isScrapped ? '#E05D5D' : '#999' }}>
                          {r.isScrapped ? '⭐' : '★'} {r.star}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '32px' }}>
                <button style={{ padding: '6px 12px', cursor: 'pointer' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>◀</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <div
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: '34px', height: '34px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      border: '0.5px solid #ccc',
                      background: currentPage === page ? '#6FBC44' : '#fff',
                      color: currentPage === page ? '#fff' : '#555'
                    }}
                  >
                    {page}
                  </div>
                ))}
                <button style={{ padding: '6px 12px', cursor: 'pointer' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>▶</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 상세 화면 ─── */}
      {view === 'detail' && currentRecipe && (
        <div style={{ padding: '28px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }} onClick={() => navigate('/recipeMain')}>
             <span style={{ fontSize: '13px', color: '#666' }}>레시피 목록으로</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', maxWidth: '960px', margin: '0 auto' }}>
            <div>
              <div style={{ height: '220px', background: currentRecipe.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '72px', marginBottom: '20px' }}>
                {currentRecipe.emoji}
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '20px 24px', marginBottom: '16px' }}>
                <div style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>{currentRecipe.name}</div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '14px' }}>{currentRecipe.desc}</div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#666' }}>
                  <span>⏱️ {currentRecipe.time}분</span>
                  <span onClick={(e) => toggleHeart(currentRecipe.id, e)} style={{ cursor: 'pointer', color: currentRecipe.isHearted ? '#E05D5D' : '#666' }}>
                    {currentRecipe.isHearted ? '❤️' : '🤍'} {currentRecipe.heart} 좋아요
                  </span>
                  <span onClick={(e) => toggleScrap(currentRecipe.id, e)} style={{ cursor: 'pointer', color: currentRecipe.isScrapped ? '#E05D5D' : '#666' }}>
                    {currentRecipe.isScrapped ? '⭐' : '★'} {currentRecipe.star} 스크랩
                  </span>
                </div>
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '20px 24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '14px' }}>조리 방법</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#666' }}>
                  {currentRecipe.steps && currentRecipe.steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#E8F5DA', color: '#3E8C1F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: '8px', padding: '18px 20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '14px' }}>재료</div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>필수 재료</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px', fontSize: '13px' }}>
                  {currentRecipe.mustIngredients && currentRecipe.mustIngredients.map((ing, idx) => (
                    <div key={idx}>• {ing.name} {ing.quantity}</div>
                  ))}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>선택 재료</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '13px' }}>
                  {currentRecipe.selectIngredients && currentRecipe.selectIngredients.map((ing, idx) => <div key={idx}>• {ing}</div>)}
                </div>
              </div>

              {currentRecipe.missingIngredients && currentRecipe.missingIngredients.length > 0 && (
                <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#791F1F', marginBottom: '8px' }}>🛒 없는 재료</div>
                  <div style={{ fontSize: '12px', color: '#A32D2D' }}>{currentRecipe.missingIngredients.join(', ')}</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={(e) => toggleScrap(currentRecipe.id, e)}
                  style={{ flex: 1, padding: '10px', background: currentRecipe.isScrapped ? '#BA7517' : '#6FBC44', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {currentRecipe.isScrapped ? '★ 스크랩 취소' : '⭐ 스크랩'}
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  style={{ flex: 1, padding: '10px', background: '#3E8C1F', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  요리하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 모달 ─── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '360px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '14px' }}>🍳 사용할 재료 및 수량 확인</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {mustIngredients.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px' }}>• {item.name}</span>
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    style={{ width: '100px', padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'right' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ flex: 1, padding: '10px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >취소</button>
              <button
                onClick={handleCookStart}
                style={{ flex: 1.5, padding: '10px', background: '#3E8C1F', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >확인 및 요리시작</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeMain;