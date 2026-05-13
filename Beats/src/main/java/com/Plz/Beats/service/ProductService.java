package com.Plz.Beats.service;

import com.Plz.Beats.entity.Product;
import com.Plz.Beats.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final S3Service s3Service;
    private final ProductRepository repository;

    public Product saveImage(MultipartFile file)
            throws Exception {

        // S3 업로드
        String imageUrl = s3Service.uploadFile(file);

        // DB 저장
        Product image =
                Product.builder()
                        .imageName(file.getOriginalFilename())
                        .imageUrl(imageUrl)
                        .build();

        return repository.save(image);
    }
}