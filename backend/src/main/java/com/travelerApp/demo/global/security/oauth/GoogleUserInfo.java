package com.travelerApp.demo.global.security.oauth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GoogleUserInfo {

    private String providerId;  // Google 사용자 고유 ID
    private String email;
    private String name;
    private String pictureUrl;
}
