package com.travelerApp.demo.domain.auth.controller;

import com.travelerApp.demo.domain.auth.dto.GoogleLoginRequest;
import com.travelerApp.demo.domain.auth.dto.LoginRequest;
import com.travelerApp.demo.domain.auth.dto.RefreshTokenRequest;
import com.travelerApp.demo.domain.auth.dto.SignupRequest;
import com.travelerApp.demo.domain.auth.dto.TokenResponse;
import com.travelerApp.demo.domain.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@Valid @RequestBody SignupRequest request) {
        Long userSeq = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "회원가입이 완료되었습니다.",
                        "userSeq", userSeq
                ));
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse tokenResponse = authService.login(request);
        return ResponseEntity.ok(tokenResponse);
    }

    // 구글 로그인
    @PostMapping("/google")
    public ResponseEntity<TokenResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        TokenResponse tokenResponse = authService.googleLogin(request.getIdToken());
        return ResponseEntity.ok(tokenResponse);
    }

    // 토큰 재발급
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        TokenResponse tokenResponse = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(tokenResponse);
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(Authentication authentication) {
        Long userSeq = (Long) authentication.getPrincipal();
        authService.logout(userSeq);
        return ResponseEntity.ok(Map.of("message", "로그아웃되었습니다."));
    }
}
