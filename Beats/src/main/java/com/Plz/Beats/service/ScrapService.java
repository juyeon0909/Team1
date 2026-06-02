package com.Plz.Beats.service;

import com.Plz.Beats.dto.RecipeDto;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.entity.Recipe;
import com.Plz.Beats.entity.Scrap;
import com.Plz.Beats.repository.MemberRepository;
import com.Plz.Beats.repository.ScrapRepository;
import com.Plz.Beats.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScrapService {

    private final ScrapRepository scrapRepository;
    private final MemberRepository memberRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeService recipeService;   // toDto 재사용을 위해 주입

    // 현재 로그인 유저의 스크랩 목록 조회
    @Transactional(readOnly = true)
    public List<RecipeDto> getScrappedRecipes(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        return scrapRepository.findByMember(member).stream()
                .map(scrap -> {
                    RecipeDto dto = recipeService.toDto(scrap.getRecipe(), member);
                    dto.setScrappedAt(scrap.getCreatedAt().toLocalDate().toString());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // 스크랩 토글 (있으면 취소, 없으면 추가)
    @Transactional
    public boolean toggleScrap(String email, Long recipeId) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 레시피입니다."));

        Optional<Scrap> existing = scrapRepository.findByMemberAndRecipe(member, recipe);

        if (existing.isPresent()) {
            scrapRepository.delete(existing.get());
            return false; // 스크랩 취소
        } else {
            Scrap newScrap = new Scrap();
            newScrap.setMember(member);
            newScrap.setRecipe(recipe);
            scrapRepository.save(newScrap);
            return true; // 스크랩 추가
        }
    }

}