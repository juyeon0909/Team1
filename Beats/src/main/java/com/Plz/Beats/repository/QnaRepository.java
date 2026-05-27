package com.Plz.Beats.repository;

import com.Plz.Beats.entity.Qna;
import com.Plz.Beats.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QnaRepository extends JpaRepository<Qna, Long> {
    List<Qna> findByMemberOrderByCreatedAtDesc(Member member);
    List<Qna> findAllByOrderByCreatedAtDesc();
}