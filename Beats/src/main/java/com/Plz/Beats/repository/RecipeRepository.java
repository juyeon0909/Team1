package com.Plz.Beats.repository;

import com.Plz.Beats.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    /**
     * 💡 [추후 확장용] 특정 회원이 작성한 레시피 목록만 조회하고 싶을 때 사용
     * 엔티티 내부의 'member' 필드와 그 안의 'email'을 타고 들어가서 조회하는 JPA 메서드 낚시 규칙입니다.
     */
    List<Recipe> findByMemberEmail(String email);
}

/* 커밋 */
