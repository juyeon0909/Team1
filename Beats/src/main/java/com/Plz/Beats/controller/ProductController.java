package com.Plz.Beats.controller;

import com.Plz.Beats.entity.Product;
import com.Plz.Beats.service.ProductService;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

//@RestController
@RequiredArgsConstructor
@RequestMapping("/image")
public class ProductController {

    private final ProductService service;


    // 이미지 업로드
    @PostMapping("/upload")
    public Product upload(
            @RequestParam("file")
            MultipartFile file) throws Exception {

        return service.saveImage(file);
    }


}