package com.Plz.Beats.service;

import com.Plz.Beats.constant.Storagetype;
import com.Plz.Beats.dto.StorageItemDto;
import com.Plz.Beats.dto.StorageItemRegisterDto;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.entity.Storage_item;
import com.Plz.Beats.repository.MemberRepository;
import com.Plz.Beats.repository.StorageItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StorageItemService {

    private final StorageItemRepository storageItemRepository;
    private final MemberRepository memberRepository;

    // 유통기한 임박 순 상위 4개 조회 (메인 페이지용)
    public List<StorageItemDto> getTop4ExpiringItems(Long memberId) {
        List<Storage_item> items = storageItemRepository.findExpiringByMemberId(
                memberId, PageRequest.of(0, 4));
        return toDto(items);
    }

    // 사용자 전체 재료 목록 조회 (보관함 페이지용)
    public List<StorageItemDto> getAllItems(Long memberId) {
        List<Storage_item> items = storageItemRepository.findAllByMemberId(memberId);
        return toDto(items);
    }

    // 재료 등록
    public void register(StorageItemRegisterDto dto) {
        Member member = memberRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        Storage_item item = new Storage_item();
        item.setMember(member);
        item.setItemname(dto.getItemname());
        item.setQuantity(dto.getQuantity());
        item.setExpirationdate(dto.getExpirationdate());
        item.setStoragetype(Storagetype.valueOf(dto.getStoragetype()));

        storageItemRepository.save(item);
    }

    private List<StorageItemDto> toDto(List<Storage_item> items) {
        LocalDate today = LocalDate.now();

        return items.stream().map(item -> {
            StorageItemDto dto = new StorageItemDto();
            dto.setId(item.getId());
            dto.setItemname(item.getItemname());
            dto.setQuantity(item.getQuantity());
            dto.setExpirationdate(item.getExpirationdate());

            String label = switch (item.getStoragetype()) {
                case REFRIGERATED -> "냉장";
                case FROZEN -> "냉동";
                case ROOM_TEMP -> "실온";
            };
            dto.setStoragetype(label);

            long dDay = ChronoUnit.DAYS.between(today, item.getExpirationdate());
            dto.setDDay(dDay);

            if (dDay <= 3) dto.setUrgency("urgent");
            else if (dDay <= 7) dto.setUrgency("warning");
            else dto.setUrgency("normal");

            dto.setProgressPercent((int) Math.min(Math.max(dDay * 10, 0), 100));

            return dto;
        }).collect(Collectors.toList());
    }
}
