package com.Plz.Beats.repository;

import com.Plz.Beats.constant.ApprovalStatus;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findByApprovalStatus(ApprovalStatus status);

    /**
     * 💡 [추후 확장용] 특정 회원이 작성한 레시피 목록만 조회하고 싶을 때 사용
     * 엔티티 내부의 'member' 필드와 그 안의 'email'을 타고 들어가서 조회하는 JPA 메서드 낚시 규칙입니다.
     */

    List<Recipe> findByApprovalStatusOrderByUpdatedAtDesc(ApprovalStatus status);

    List<Recipe> findByMember(Member member);

    @Modifying
    @Transactional
    @Query("update Recipe r set r.approvalStatus = :status where r.id = :recipeId")
    int updateApprovalStatus(@Param("recipeId") Long recipeId, @Param("status") ApprovalStatus status);

}

