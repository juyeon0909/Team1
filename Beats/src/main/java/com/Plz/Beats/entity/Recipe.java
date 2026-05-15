package com.Plz.Beats.entity;
import com.Plz.Beats.constant.ApprovalStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.LastModifiedDate;

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
    @GeneratedValue(strategy = GenerationType.IDENTITY) //기본키 자동 생성
    @Column(name = "recipes_id")
    private Long id;

    //작성자
    // @JoinColumn이 있으면 무조건 fk
    // name은 참조하는 pk이름과 동일
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Member member;

    //카테고리 id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Category category;

    //레시피 제목
    @Column(nullable = false)
    @NotBlank(message = "레시피 제목은 필수 기입 사항입니다.")
    @Size(max=15, message = "레시피 제목은 최대 15자리 이하로만 입력해 주세요")
    private String title;

    // 요리명
    @Column(nullable = false)
    @NotBlank(message = "요리명은 필수 기입 사항입니다.")
    @Size(max=15, message = "요리명은 최대 15자리 이하로만 입력해 주세요")
    private String dishName;

    //간단 소개
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
    @Size(max = 10000, message = "레시피에 대한 설명은 최대 1,0000 자리 이하로만 입력해 주세요.")
    private String cookingMethod;

    // 승인 여부
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    private ApprovalStatus approvalStatus;

    // 조회수
    private Long viewCount = 0L;

    // 재료
    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RecipeIngredient> recipeIngredients = new ArrayList<>();

    //업로드 일자
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDateTime updatedAt;
}
