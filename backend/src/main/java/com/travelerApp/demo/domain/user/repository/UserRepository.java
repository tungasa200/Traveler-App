package com.travelerApp.demo.domain.user.repository;

import com.travelerApp.demo.domain.user.entity.AuthProvider;
import com.travelerApp.demo.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // 이메일로 사용자 조회
    Optional<User> findByEmail(String email);

    // 이메일 존재 여부 확인
    boolean existsByEmail(String email);

    // OAuth 제공자와 제공자 ID로 사용자 조회
    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);
}
