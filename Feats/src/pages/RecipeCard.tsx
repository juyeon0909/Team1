import React from 'react';
import type { RecipeView } from '../types/Recipe';
import '../components/Recipecard.css';

interface RecipeCardProps {
  recipe: RecipeView;
  onClick?: (id: number) => void;
  /** 이미지 우측 상단 버튼 (스크랩/좋아요 취소 등) */
  imageAction?: React.ReactNode;
  /** 하단 메타 영역 우측에 덧붙일 내용 (좋아요 수, 스크랩 날짜 등) */
  metaExtra?: React.ReactNode;
  /** 카드 맨 아래 액션 바 (수정/삭제 버튼 등) */
  footer?: React.ReactNode;
  /** 카드에 추가할 클래스 (제거 애니메이션 등) */
  className?: string;
}

const getMatchBadgeClass = (match: number) => {
  if (!match) return '';
  if (match >= 100) return 'badge-match-full';
  if (match >= 80) return 'badge-match-high';
  return 'badge-match-mid';
};

const RecipeCard = ({
  recipe: r,
  onClick,
  imageAction,
  metaExtra,
  footer,
  className = '',
}: RecipeCardProps) => {
  return (
    <div
      className={`rc-card ${className}`}
      onClick={() => onClick?.(r.id)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="rc-image" style={{ backgroundColor: r.bg }}>
        {r.image ? (
          <img src={r.image} alt={r.title} className="rc-image-file" />
        ) : (
          <span className="rc-emoji">{r.emoji}</span>
        )}

        {r.match > 0 && (
          <span className={`rc-match-badge ${getMatchBadgeClass(r.match)}`}>
            {r.match >= 100 ? '100% 일치' : `${r.match}% 일치`}
          </span>
        )}

        {r.urgent && <span className="rc-urgent-badge">임박재료활용</span>}

        {imageAction && <div className="rc-image-action">{imageAction}</div>}
      </div>

      <div className="rc-body">
        <div className="rc-top-row">
          <span className="rc-category">{r.category}</span>
          <span className="rc-name">{r.title}</span>
        </div>

        {r.desc && <div className="rc-desc">{r.desc}</div>}

        {(r.mustIngredients?.length ?? 0 ) > 0 && (
          <div className="rc-ingredients">
            {r.mustIngredients.slice(0, 3).map((ing, i) => (
              <span key={`${ing.name}-${i}`} className="rc-ingredient-chip">{ing.name}</span>
            ))}
            {r.mustIngredients!.length > 3 && (
              <span className="rc-ingredient-more">+{r.mustIngredients!.length - 3}</span>
            )}
          </div>
        )}

        {(r.tags?.length ?? 0) > 0 && (
          <div className="rc-tags">
            {r.tags!.map((t, i) => <span key={`${t}-${i}`} className="rc-tag">{t}</span>)}
          </div>
        )}

        <div className="rc-footer-meta">
          <div className="rc-meta">
            <span>⏱️ {r.time}분</span>
            {r.author && <span className="rc-author">👤 {r.author}</span>}
          </div>
          {metaExtra && <div className="rc-meta-extra">{metaExtra}</div>}
        </div>

        {footer && <div className="rc-action-bar">{footer}</div>}
      </div>
    </div>
  );
};

export default RecipeCard;
