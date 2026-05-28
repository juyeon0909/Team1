package com.Plz.Beats.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Profile("local")
public class LocalImageStorageService implements ImageStorageService {
    @Value("${app.storage.local.root}")
    private String root;

    @Value("$(app.storage.local.base-url}")
    private String baseUrl;

    @Override
    public String store(MultipartFile file, String dir) {
        try {
            String ext = getExtension(file.getOriginalFilename());
            String key = dir + "/" + UUID.randomUUID() + ext;

            Path target = Paths.get(root, key);
            Files.createDirectories(target.getParent());
            file.transferTo(target);

            return  key; //db에는 이 키만 저장할거임
        }catch(IOException e){
            throw new RuntimeException("이미지 저장 실패", e);
        }
    }
    @Override
    public void delete(String key) {
        try {
            Files.deleteIfExists(Paths.get(root, key));
        } catch (IOException e) {
            throw new RuntimeException("이미지 삭제 실패", e);
        }
    }

    @Override
    public String getUrl(String key) {
        return baseUrl + "/" + key;   // http://localhost:9000/images/recipe/uuid.jpg
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
    }
}
