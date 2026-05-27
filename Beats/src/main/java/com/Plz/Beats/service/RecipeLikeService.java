package com.Plz.Beats.service;


import com.Plz.Beats.dto.RecipeLikeDto;
import com.Plz.Beats.entity.Member;
import com.Plz.Beats.entity.Recipe;
import com.Plz.Beats.entity.RecipeLike;
import com.Plz.Beats.repository.MemberRepository;
import com.Plz.Beats.repository.RecipeLikeRepository;
import com.Plz.Beats.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeLikeService {

    private final RecipeLikeRepository recipeLikeRepository;
    private final MemberRepository memberRepository;
    private final RecipeRepository recipeRepository;

    //현재 로그인 유저의 좋아요 목록 조회
    public List<RecipeLikeDto> getLikedRecipes(String email) {
        Member member = memberRepository.findByEmail(email);
        if (member == null) throw new IllegalArgumentException("존재하지 않는 회원입니다.");

        return recipeLikeRepository.findByMember(member).stream()
                .map(like -> {
                    Recipe r = like.getRecipe();
                    return new RecipeLikeDto(
                            r.getId(),
                            r.getTitle(),
                            r.getCategory().getDescription(),
                            r.getCookingTime() + "분",
                            r.getMember().getName(),
                            recipeLikeRepository.countByRecipe(r),
                            true,
                            like.getCreatedAt().toLocalDate().toString()
                    );
                })
                .collect(Collectors.toList());
    }
    // 좋아요 토글 (있으면 취소, 없으면 추가)
    @Transactional
    public boolean toggleLike(String email, Long recipeId) {
        Member member = memberRepository.findByEmail(email);
        if (member == null) throw new IllegalArgumentException("존재하지 않는 회원입니다.");

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 레시피입니다."));

        Optional<RecipeLike> existing = recipeLikeRepository.findByMemberAndRecipe(member, recipe);

        if (existing.isPresent()) {
            recipeLikeRepository.delete(existing.get());
            return false; // 취소됨
        } else {
            RecipeLike newLike = new RecipeLike();
            newLike.setMember(member);
            newLike.setRecipe(recipe);
            recipeLikeRepository.save(newLike);
            return true; // 추가됨
        }
    }

}
