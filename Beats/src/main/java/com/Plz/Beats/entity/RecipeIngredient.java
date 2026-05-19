package com.Plz.Beats.entity;

// 1. 필요한 임포트 구문 전체 추가
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor // Lombok: 기본 생성자 자동 생성
@Entity
@Table(name = "recipe_ingredients") // 💡 members -> recipe_ingredients로 변경
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 💡 @Column 제거, 변수명을 객체 지향 관례에 맞게 'recipe'로 변경
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    // 💡 @Column 제거, 이전 단계에서 만든 'Item' 엔티티를 참조하도록 매핑
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    private String unit; // VARCHAR (단위: g, ml, 스푼 등)

    private int quantity; // 수량

    // 💡 자바 변수명은 camelCase가 관례이므로 isRequired로 변경하되, DB 컬럼명은 snake_case 유지
    @Column(name = "is_required", nullable = false)
    private boolean isRequired;
}