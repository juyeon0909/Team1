// repository/RecipeIngredientRepository.java
package com.Plz.Beats.repository;

import com.Plz.Beats.entity.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Long> {

    // 특정 레시피의 재료 item.id 목록
    @Query("SELECT ri.item.id FROM RecipeIngredient ri WHERE ri.recipe.id = :recipeId")
    List<Long> findItemIdsByRecipeId(@Param("recipeId") Long recipeId);
}