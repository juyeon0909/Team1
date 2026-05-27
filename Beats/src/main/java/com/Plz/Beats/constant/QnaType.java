package com.Plz.Beats.constant;

public enum QnaType {
    SERVICE("서비스 이용 문의"),
    ERROR("오류 및 버그 신고"),
    SUGGESTION("건의 및 제안"),
    ETC("기타 문의");

    private final String description;
    QnaType(String description) { this.description = description; }
    public String getDescription() { return description; }
}