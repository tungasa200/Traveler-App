package com.travelerApp.demo.domain.auth.service;

import com.travelerApp.demo.domain.auth.dto.LoginRequest;
import com.travelerApp.demo.domain.auth.dto.SignupRequest;
import com.travelerApp.demo.domain.auth.dto.TokenResponse;
import com.travelerApp.demo.domain.auth.entity.RefreshToken;
import com.travelerApp.demo.domain.auth.repository.RefreshTokenRepository;
import com.travelerApp.demo.domain.user.entity.AuthProvider;
import com.travelerApp.demo.domain.user.entity.User;
import com.travelerApp.demo.domain.user.repository.UserRepository;
import com.travelerApp.demo.global.security.jwt.JwtTokenProvider;
import com.travelerApp.demo.global.security.oauth.GoogleTokenVerifier;
import com.travelerApp.demo.global.security.oauth.GoogleUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final GoogleTokenVerifier googleTokenVerifier;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    // 회원가입
    @Transactional
    public Long signup(SignupRequest request) {
        // 이메일 중복 확인
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        // 사용자 생성
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .provider(AuthProvider.LOCAL)
                .build();

        User savedUser = userRepository.save(user);
        return savedUser.getSeq();
    }

    // 로그인
    @Transactional
    public TokenResponse login(LoginRequest request) {
        // 사용자 조회
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다."));

        // 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }

        // 계정 활성화 상태 확인
        if (!user.getIsActive()) {
            throw new IllegalArgumentException("비활성화된 계정입니다.");
        }

        // 마지막 로그인 시간 갱신
        user.updateLastLoginAt();

        // 토큰 발급
        return createTokens(user);
    }

    // Access Token 재발급
    @Transactional
    public TokenResponse refresh(String refreshTokenValue) {
        // Refresh Token 유효성 검증
        if (!jwtTokenProvider.validateToken(refreshTokenValue)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }

        // DB에서 Refresh Token 조회
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 리프레시 토큰입니다."));

        // 만료 여부 확인
        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new IllegalArgumentException("만료된 리프레시 토큰입니다.");
        }

        User user = refreshToken.getUser();

        // 계정 활성화 상태 확인
        if (!user.getIsActive()) {
            throw new IllegalArgumentException("비활성화된 계정입니다.");
        }

        // 새 토큰 발급
        return createTokens(user);
    }

    // 로그아웃
    @Transactional
    public void logout(Long userSeq) {
        refreshTokenRepository.deleteByUserSeq(userSeq);
    }

    // 구글 로그인
    @Transactional
    public TokenResponse googleLogin(String idToken) {
        // Google ID Token 검증
        GoogleUserInfo googleUserInfo = googleTokenVerifier.verify(idToken);

        if (googleUserInfo == null) {
            throw new IllegalArgumentException("유효하지 않은 Google 토큰입니다.");
        }

        // 기존 사용자 조회 또는 신규 가입
        User user = userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, googleUserInfo.getProviderId())
                .orElseGet(() -> {
                    // 이메일로 기존 LOCAL 계정 확인
                    if (userRepository.existsByEmail(googleUserInfo.getEmail())) {
                        throw new IllegalArgumentException("이미 일반 회원가입으로 가입된 이메일입니다.");
                    }

                    // 신규 사용자 생성
                    User newUser = User.builder()
                            .email(googleUserInfo.getEmail())
                            .nickname(googleUserInfo.getName())
                            .provider(AuthProvider.GOOGLE)
                            .providerId(googleUserInfo.getProviderId())
                            .build();

                    return userRepository.save(newUser);
                });

        // 계정 활성화 상태 확인
        if (!user.getIsActive()) {
            throw new IllegalArgumentException("비활성화된 계정입니다.");
        }

        // 마지막 로그인 시간 갱신
        user.updateLastLoginAt();

        // 토큰 발급
        return createTokens(user);
    }

    // 토큰 생성 및 저장
    private TokenResponse createTokens(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(user.getSeq(), user.getEmail());
        String refreshTokenValue = jwtTokenProvider.createRefreshToken(user.getSeq());

        // 기존 Refresh Token 삭제 후 새로 저장
        refreshTokenRepository.findByUser(user)
                .ifPresent(refreshTokenRepository::delete);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiryDate(LocalDateTime.now().plusSeconds(jwtTokenProvider.getRefreshTokenExpiration() / 1000))
                .build();

        refreshTokenRepository.save(refreshToken);

        return TokenResponse.of(
                accessToken,
                refreshTokenValue,
                accessTokenExpiration / 1000 // 초 단위로 변환
        );
    }
}
