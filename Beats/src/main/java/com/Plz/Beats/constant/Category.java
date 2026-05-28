package com.Plz.Beats.constant;

public enum Category {
    // ALL, BREAD같은건 객체 Category(String description) 생성자에 보내지는 매개변수
    // ()안에 있는 것은
    ALL("전체"), KOR("한식"), JAN("일식"), CHN("중식"),YANG("양식"), GAN("간식"), YA("야식"), DIET("다이어트식"), RAP("밀프랩");

    // 매개변수가 문자열이니까 String으로 지정
    // 그냥 맴버변수 만든거임
    private String description ;

    Category(String description) { // 생성자
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
