package com.Plz.Beats.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

/**
 * 회원이 특정 레시피를 '스크랩'한 1건을 의미하는 엔티티.
 * 기획서: 스크랩 목록 페이지(본인 스크랩만 분류, 별 아이콘으로 즉시 취소),
 *        메인페이지 '스크랩 많은 순' 정렬 근거 데이터.
 *
 * (member, recipe) 조합은 유일해야 한다(같은 레시피 중복 스크랩 불가).
 */
@Getter
@Setter
@ToString
@NoArgsConstructor // JPA 필수: 기본 생성자
@Entity
@Table(
        name = "scraps",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_scrap_member_recipe",
                columnNames = {"member_id", "recipe_id"}
        )
)
public class Scrap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scrap_id")
    private Long id;

    // 스크랩한 회원 (FK)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 스크랩 대상 레시피 (FK)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    // 스크랩한 시각
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}