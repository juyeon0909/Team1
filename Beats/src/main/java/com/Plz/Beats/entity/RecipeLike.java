package com.Plz.Beats.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

/**
 * 회원이 특정 레시피에 누른 '좋아요' 1건을 의미하는 엔티티.
 * 기획서: 마이페이지 > 좋아요(본인이 좋아요 누른 게시글 확인 / 취소 가능),
 *        메인페이지 추천 정렬(좋아요 많은 순) 근거 데이터.
 *
 * (member, recipe) 조합은 유일해야 한다(한 사람이 같은 레시피에 좋아요 2번 불가).
 */
@Getter
@Setter
@ToString
@NoArgsConstructor // JPA 필수: 기본 생성자
@Entity
@Table(
        name = "recipe_likes",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_recipe_like_member_recipe",
                columnNames = {"member_id", "recipe_id"}
        )
)
public class RecipeLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recipe_like_id")
    private Long id;

    // 좋아요를 누른 회원 (FK)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 좋아요 대상 레시피 (FK)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    // 누른 시각
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // @EnableJpaAuditing 설정에 의존하지 않도록 @PrePersist 로 시각 주입.
    // (Storage_item 이 쓰는 @CreatedDate 방식과 다르지만, 추가 설정 없이 확실히 동작합니다.)
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}