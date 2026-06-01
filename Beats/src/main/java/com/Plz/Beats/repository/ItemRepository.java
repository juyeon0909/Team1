package com.Plz.Beats.repository;

import com.Plz.Beats.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    @Query(value = "SELECT * FROM items WHERE item_name LIKE CONCAT('%', :name, '%')", nativeQuery = true)
    List<Item> findByNameContaining(@Param("name") String name);
}