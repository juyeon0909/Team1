package com.Plz.Beats.storage;

import org.springframework.web.multipart.MultipartFile;

public interface ImageStorageService {
    /** 파일을 저장하고, DB에 보관할 key를 반환 */
    String store(MultipartFile file, String dir);   // 예: dir="recipe" → "recipe/uuid.jpg"

    /** key로 파일 삭제 */
    void delete(String key);

    /** key를 브라우저가 접근 가능한 전체 URL로 변환 */
    String getUrl(String key);
}
