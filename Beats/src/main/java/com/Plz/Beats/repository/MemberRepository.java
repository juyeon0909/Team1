package com.Plz.Beats.repository;

import com.Plz.Beats.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    Optional<Member> findByEmail(String email);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM storage_items WHERE member_id = :memberId", nativeQuery = true)
    void deleteStorageItemsByMemberId(@Param("memberId") Long memberId);
}