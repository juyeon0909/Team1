package com.Plz.Beats.repository;

import com.Plz.Beats.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    /**
     * 재료 이름(String)으로 Item 엔티티를 조회하는 쿼리 메서드
     * 💡 만약 Item 엔티티 내부의 이름 필드명이 'name'이 아니라 'itemName' 이라면
     * findByItemName(String itemName) 으로 이름을 변경해야 합니다.
     */
    Optional<Item> findByName(String name);
}