//package com.Plz.Beats.controller;
//
//import com.Plz.Beats.entity.Product;
//import com.Plz.Beats.repository.ProductRepository;
//import com.Plz.Beats.service.ProductService;
//import lombok.RequiredArgsConstructor;
//
//import org.springframework.stereotype.Controller;
//import org.springframework.ui.Model;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.PostMapping;
//
//import org.springframework.web.bind.annotation.RequestParam;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.util.List;
//
//@Controller
//@RequiredArgsConstructor
//public class UploadController {
//
//    private final ProductService ProductService;
//
//    /**
//     * 업로드 폼 페이지 이동
//     */
//    @GetMapping("/")
//    public String home() {
//
//        return "upload";
//    }
//
//    /**
//     * 이미지 업로드 처리
//     */
//    @PostMapping("/image/upload")
//    public String uploadImage(
//            @RequestParam("file")
//            MultipartFile file,
//            Model model) {
//
//        try {
//
//            // S3 업로드 + DB 저장
//            Product image =
//                    ProductService.saveImage(file);
//
//            // 화면 전달
//            model.addAttribute(
//                    "imageName",
//                    image.getImageName());
//
//            model.addAttribute(
//                    "imageUrl",
//                    image.getImageUrl());
//
//        } catch (Exception e) {
//
//            model.addAttribute(
//                    "error",
//                    "업로드 실패");
//
//            e.printStackTrace();
//        }
//
//        return "result";
//    }
//    private final ProductRepository repository;
//    // 이미지 목록 조회
//    @GetMapping("/image/list")
//    public List<Product> list() {
//
//        return repository.findAll();
//    }
//}
