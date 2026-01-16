package com.travelerApp.demo.domain.auth.repository;

import com.travelerApp.demo.domain.auth.entity.RefreshToken;
import com.travelerApp.demo.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    // 토큰 값으로 조회
    Optional<RefreshToken> findByToken(String token);

    // 사용자로 조회
    Optional<RefreshToken> findByUser(User user);

    // 사용자 ID로 삭제 (로그아웃 시)
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    // 만료된 토큰 삭제
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);
}
