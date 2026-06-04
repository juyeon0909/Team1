package com.Plz.Beats.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    // application.properties 의 spring.mail.username 을 발신자로 사용
    @Value("${spring.mail.username}")
    private String fromAddress;

    /**
     * 비동기 메일 발송. 실패해도 호출한 쪽(레시피 수정)에는 영향 없음.
     */
    @Async
    public void sendMail(String to, String subject, String body) {
        if (to == null || to.isBlank()) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            // 메일 실패는 로그만 — 수정 자체는 이미 끝났으므로 흐름에 영향 주지 않음
            System.err.println("메일 발송 실패 (to=" + to + "): " + e.getMessage());
        }
    }
}