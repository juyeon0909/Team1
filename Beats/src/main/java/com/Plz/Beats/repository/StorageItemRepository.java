package com.Plz.Beats.repository;

import com.Plz.Beats.entity.Storage_item;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StorageItemRepository extends JpaRepository<Storage_item, Long> {

    @Query("SELECT s FROM Storage_item s WHERE s.member.id = :memberId AND s.expirationdate IS NOT NULL ORDER BY s.expirationdate ASC")
    List<Storage_item> findExpiringByMemberId(@Param("memberId") Long memberId, Pageable pageable);

    @Query("SELECT s FROM Storage_item s JOIN FETCH s.item WHERE s.member.id = :memberId ORDER BY s.expirationdate ASC")
    List<Storage_item> findAllByMemberId(@Param("memberId") Long memberId);
}
