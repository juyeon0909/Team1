package com.Plz.Beats.constant;

public enum QnaStatus {
    PENDING("접수중"),
    ANSWERED("답변완료");

    private final String description;
    QnaStatus(String description) { this.description = description; }
    public String getDescription() { return description; }
}