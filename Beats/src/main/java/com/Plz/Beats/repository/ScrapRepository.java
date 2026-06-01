package com.Plz.Beats.repository;

import com.Plz.Beats.entity.Member;
import com.Plz.Beats.entity.Recipe;
import com.Plz.Beats.entity.Scrap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ScrapRepository extends JpaRepository<Scrap, Long> {
    List<Scrap> findByMember(Member member);
    Optional<Scrap> findByMemberAndRecipe(Member member, Recipe recipe);
    long countByRecipe(Recipe recipe);
}