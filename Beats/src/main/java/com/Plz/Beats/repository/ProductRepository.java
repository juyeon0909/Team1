package com.Plz.Beats.repository;

import com.Plz.Beats.entity.Storage_item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

public interface ProductRepository
        extends JpaRepository<Storage_item, Long> {
}
