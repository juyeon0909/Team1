package com.Plz.Beats.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ApiResponse {
    private String message;

    public static ApiResponse of(String message) {
        return new ApiResponse(message);
    }
}