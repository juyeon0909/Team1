package com.Plz.Beats.entity;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.annotation.ElementType;

@Target(ElementType.METHOD) // 메서드에 적용
@Retention(RetentionPolicy.RUNTIME) // 런타임까지 유지
public @interface MyAnnotation {
    String value();
}
