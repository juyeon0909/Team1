package com.Plz.Beats.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Entity
@Table(name = "Categories")

public class Categories {

    @Id // 프라이머리 키
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long category_id; // 레시피

    @Column(nullable = false, unique = true) // 유니크 키, 공백 x
    private String category_name;
}
