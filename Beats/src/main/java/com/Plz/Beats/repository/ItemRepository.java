package com.Plz.Beats.repository;

import com.Plz.Beats.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    @Query(value = "SELECT * FROM items WHERE item_name LIKE CONCAT('%', :name, '%')", nativeQuery = true)
    List<Item> findByNameContaining(@Param("name") String name);

    /**
     * 재료 이름(String)으로 Item 엔티티를 조회하는 쿼리 메서드
     * 💡 만약 Item 엔티티 내부의 이름 필드명이 'name'이 아니라 'itemName' 이라면
     * findByItemName(String itemName) 으로 이름을 변경해야 합니다.
     */
    Optional<Item> findByName(String name);

    @Query(value = "SELECT DISTINCT category FROM items WHERE category IS NOT NULL", nativeQuery = true)
    List<String> findAllDistinctCategories();
}