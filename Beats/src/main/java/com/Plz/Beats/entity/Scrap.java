package com.Plz.Beats.entity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "recipe_scraps")
@Getter
@NoArgsConstructor
public class RecipeScrap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public RecipeScrap(User user, Recipe recipe) {
        this.user = user;
        this.recipe = recipe;
        this.createdAt = LocalDateTime.now();
    }
}
