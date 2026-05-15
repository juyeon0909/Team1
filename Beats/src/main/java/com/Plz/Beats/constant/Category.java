package com.Plz.Beats.constant;

public enum Category {
    // ALL, BREAD같은건 객체 Category(String description) 생성자에 보내지는 매개변수
    // ()안에 있는 것은
    ALL("전체"), BREAD("빵"), BEVERAGE("음료수"), CAKE("케이크"), MACARON("마카롱") ;

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
