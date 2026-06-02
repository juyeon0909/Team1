package com.Plz.Beats.service;

import com.Plz.Beats.constant.Storagetype;
import com.Plz.Beats.dto.StorageItemDto;
import com.Plz.Beats.dto.StorageItemRegisterDto;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.entity.Item;
import com.Plz.Beats.entity.Storage_item;
import com.Plz.Beats.repository.ItemRepository;
import com.Plz.Beats.repository.MemberRepository;
import com.Plz.Beats.repository.StorageItemRepository;
import jakarta.persistence.EntityNotFoundException;
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
    private final ItemRepository itemRepository;

    // 유통기한 임박 순 상위 4개 조회
    public List<StorageItemDto> getTop4ExpiringItems(Long memberId) {
        List<Storage_item> items = storageItemRepository.findExpiringByMemberId(
                memberId, PageRequest.of(0, 4));
        return toDto(items);
    }

    // 사용자 전체 재료 목록 조회
    public List<StorageItemDto> getAllItems(Long memberId) {
        List<Storage_item> items = storageItemRepository.findAllByMemberId(memberId);
        return toDto(items); // 내부 가공 툴 호출
    }

    // 재료 등록
    public void register(StorageItemRegisterDto dto) {
        Member member = memberRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        Item realItem = itemRepository.findById(dto.getItemId())
                .orElseThrow(() -> new EntityNotFoundException("존재하지 않는 식재료 항목입니다."));

        Storage_item item = new Storage_item();
        item.setMember(member);
        item.setItem(realItem);
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

            dto.setItemName(item.getItem().getName());
            dto.setQuantity(item.getQuantity());

            dto.setExpirationDate(item.getExpirationdate());
            dto.setCategory(item.getItem().getCategory());

            dto.setStorageType(item.getStoragetype().name());

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