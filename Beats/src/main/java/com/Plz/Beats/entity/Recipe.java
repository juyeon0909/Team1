package com.Plz.Beats.entity;

import com.Plz.Beats.constant.ApprovalStatus;
import com.Plz.Beats.constant.Category; // enum 방식으로 결정 → 다시 사용
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ToString
@Entity
@Table(name = "recipes")
public class Recipe {
    // 레시피 id
    @Id //기본키
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recipes_id")
    private Long id;

    // 작성자
    // @JoinColumn이 있으면 무조건 fk
    // name은 참조하는 pk이름과 동일
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    // 카테고리
    // 변경 핵심: @ManyToOne(엔티티) → @Enumerated(enum) 으로 수정.
    //   - EnumType.STRING : DB에 "KOR", "WEST" 처럼 이름이 저장됨(권장).
    //     절대 EnumType.ORDINAL 쓰지 말 것 — enum 순서 바뀌면 기존 데이터가 깨짐.
    //   - length 20 : 가장 긴 enum 이름(DIET 등)도 충분히 수용.
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    @NotNull(message = "카테고리는 필수 선택 사항입니다.")
    private Category category;

    // 레시피 제목
    @Column(nullable = false)
    @NotBlank(message = "레시피 제목은 필수 기입 사항입니다.")
    @Size(max = 15, message = "레시피 제목은 최대 15자리 이하로만 입력해 주세요")
    private String title;

    // 요리명
    @Column(nullable = false)
    @NotBlank(message = "요리명은 필수 기입 사항입니다.")
    @Size(max = 15, message = "요리명은 최대 15자리 이하로만 입력해 주세요")
    private String dishName;

    // 간단 소개
    @Lob
    private String description;

    // 요리 사진
    @Column(nullable = false)
    @NotBlank(message = "이미지는 필수 입력 사항입니다.")
    private String image;

    // 소요 시간
    @Column(nullable = false)
    @Min(value = 0, message = "소요 시간은 반드시 0분 이상이여야 합니다.")
    private Integer cookingTime;

    // 요리 방법
    @Lob
    @Column(nullable = false)
    @NotBlank(message = "필수 기입란입니다.")
    @Size(max = 10000, message = "레시피에 대한 설명은 최대 10000 자리 이하로만 입력해 주세요.")
    private String cookingMethod;

    // 승인 여부
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    private ApprovalStatus approvalStatus;

    //   조회수
    private Long viewCount = 0L;

    // 재료
    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RecipeIngredient> recipeIngredients = new ArrayList<>();

    // 좋아요 — 레시피 삭제 시 연쇄 삭제
    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RecipeLike> recipeLikes = new ArrayList<>();

    // 스크랩 — 레시피 삭제 시 연쇄 삭제
    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Scrap> scraps = new ArrayList<>();

    // 업로드 일자
    // 주의: 타입이 LocalDateTime 인데 패턴이 'yyyy-MM-dd' 라 직렬화 시 시간 정보가 사라집니다.
    //       (그대로 둘지 'yyyy-MM-dd HH:mm:ss' 로 바꿀지는 결정 필요 — 값은 임의로 변경하지 않았습니다.)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDateTime updatedAt;
}