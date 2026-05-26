package com.Plz.Beats.repository;

import com.Plz.Beats.entity.Member;
import com.Plz.Beats.entity.Recipe;
import com.Plz.Beats.entity.RecipeLike;
import org.springframework.boot.autoconfigure.context.LifecycleAutoConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecipeLikeRepository extends JpaRepository<RecipeLike, Long> {
    List<RecipeLike> findByMember(Member member);
    Optional<RecipeLike> findByMemberAndRecipe(Member member, Recipe recipe);
    long countByRecipe(Recipe recipe);
}
