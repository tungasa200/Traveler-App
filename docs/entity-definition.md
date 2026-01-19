# 엔티티 정의서

## 1. 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | Traveler App |
| 프레임워크 | Spring Boot 3.x |
| ORM | Spring Data JPA |
| 패키지 | com.travelerApp.demo |
| 작성일 | 2026-01-19 |

---

## 2. 엔티티 목록

| 엔티티명 | 테이블명 | 패키지 경로 | 설명 | 상태 |
|----------|----------|-------------|------|------|
| User | users | domain.user.entity | 사용자 정보 | 구현완료 |
| RefreshToken | refresh_tokens | domain.auth.entity | JWT 리프레시 토큰 | 구현완료 |
| AuthProvider | - | domain.user.entity | 인증 제공자 Enum | 구현완료 |
| City | cities | domain.city.entity | 즐겨찾기 도시 | 미구현 |
| Expense | expenses | domain.expense.entity | 지출 기록 | 미구현 |
| Schedule | schedules | domain.schedule.entity | 여행 일정 | 미구현 |

---

## 3. 엔티티 상세 정의

### 3.1 User (사용자)

**파일 위치**: `domain/user/entity/User.java`

#### 필드 정의

| 필드명 | 자바 타입 | DB 컬럼 | 제약조건 | 설명 |
|--------|-----------|---------|----------|------|
| seq | Long | seq | PK, AUTO_INCREMENT | 기본키 |
| email | String | email | NOT NULL, UNIQUE | 이메일 |
| password | String | password | NULLABLE | 암호화된 비밀번호 |
| nickname | String | nickname | NOT NULL | 닉네임 |
| provider | AuthProvider | provider | NOT NULL | 인증 제공자 (Enum) |
| providerId | String | provider_id | NULLABLE | OAuth 제공자 사용자 ID |
| createdAt | LocalDateTime | created_at | NOT NULL | 가입 일시 |
| updatedAt | LocalDateTime | updated_at | NULLABLE | 수정 일시 |
| lastLoginAt | LocalDateTime | last_login_at | NULLABLE | 마지막 로그인 일시 |
| isActive | Boolean | is_active | NOT NULL, DEFAULT TRUE | 활성화 상태 |

#### 어노테이션

```java
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
```

#### 생명주기 콜백

| 메서드 | 어노테이션 | 동작 |
|--------|------------|------|
| onCreate() | @PrePersist | 엔티티 저장 전 createdAt, updatedAt 설정 |
| onUpdate() | @PreUpdate | 엔티티 수정 전 updatedAt 갱신 |

#### 비즈니스 메서드

| 메서드명 | 파라미터 | 반환 | 설명 |
|----------|----------|------|------|
| updateNickname | String nickname | void | 닉네임 변경 |
| updatePassword | String password | void | 비밀번호 변경 |
| updateLastLoginAt | - | void | 마지막 로그인 시간 갱신 |
| activate | - | void | 계정 활성화 |
| deactivate | - | void | 계정 비활성화 |

#### 코드

```java
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long seq;

    @Column(nullable = false, unique = true)
    private String email;

    private String password;

    @Column(nullable = false)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider provider;

    private String providerId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime lastLoginAt;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Builder
    public User(String email, String password, String nickname,
                AuthProvider provider, String providerId) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.provider = provider;
        this.providerId = providerId;
    }
}
```

---

### 3.2 RefreshToken (리프레시 토큰)

**파일 위치**: `domain/auth/entity/RefreshToken.java`

#### 필드 정의

| 필드명 | 자바 타입 | DB 컬럼 | 제약조건 | 설명 |
|--------|-----------|---------|----------|------|
| seq | Long | seq | PK, AUTO_INCREMENT | 기본키 |
| user | User | user_seq | NOT NULL, FK | 사용자 (ManyToOne) |
| token | String | token | NOT NULL, UNIQUE | 토큰 값 |
| expiryDate | LocalDateTime | expiry_date | NOT NULL | 만료 일시 |
| createdAt | LocalDateTime | created_at | NOT NULL | 생성 일시 |

#### 연관관계

| 대상 엔티티 | 관계 | Fetch 전략 | 설명 |
|-------------|------|------------|------|
| User | ManyToOne | LAZY | 한 사용자가 여러 토큰 보유 가능 |

#### 비즈니스 메서드

| 메서드명 | 파라미터 | 반환 | 설명 |
|----------|----------|------|------|
| isExpired | - | boolean | 토큰 만료 여부 확인 |
| updateToken | String token, LocalDateTime expiryDate | void | 토큰 갱신 |

#### 코드

```java
@Entity
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long seq;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_seq", nullable = false)
    private User user;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public RefreshToken(User user, String token, LocalDateTime expiryDate) {
        this.user = user;
        this.token = token;
        this.expiryDate = expiryDate;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiryDate);
    }

    public void updateToken(String token, LocalDateTime expiryDate) {
        this.token = token;
        this.expiryDate = expiryDate;
    }
}
```

---

### 3.3 AuthProvider (인증 제공자 Enum)

**파일 위치**: `domain/user/entity/AuthProvider.java`

#### Enum 값

| 값 | 설명 |
|----|------|
| LOCAL | 일반 이메일 회원가입 |
| GOOGLE | 구글 OAuth 로그인 |

#### 코드

```java
public enum AuthProvider {
    LOCAL,  // 일반 회원가입
    GOOGLE  // 구글 OAuth
}
```

---

### 3.4 City (즐겨찾기 도시) - 미구현

**예정 파일 위치**: `domain/city/entity/City.java`

#### 필드 정의 (예정)

| 필드명 | 자바 타입 | DB 컬럼 | 제약조건 | 설명 |
|--------|-----------|---------|----------|------|
| seq | Long | seq | PK, AUTO_INCREMENT | 기본키 |
| user | User | user_seq | NOT NULL, FK | 사용자 |
| name | String | name | NOT NULL | 도시명 |
| country | String | country | NOT NULL | 국가명 |
| latitude | Double | latitude | NOT NULL | 위도 |
| longitude | Double | longitude | NOT NULL | 경도 |
| createdAt | LocalDateTime | created_at | NOT NULL | 생성 일시 |

---

### 3.5 Expense (지출 기록) - 미구현

**예정 파일 위치**: `domain/expense/entity/Expense.java`

#### 필드 정의 (예정)

| 필드명 | 자바 타입 | DB 컬럼 | 제약조건 | 설명 |
|--------|-----------|---------|----------|------|
| seq | Long | seq | PK, AUTO_INCREMENT | 기본키 |
| user | User | user_seq | NOT NULL, FK | 사용자 |
| amount | BigDecimal | amount | NOT NULL | 금액 |
| currency | String | currency | NOT NULL, DEFAULT 'KRW' | 통화 코드 |
| category | String | category | NOT NULL | 카테고리 |
| memo | String | memo | NULLABLE | 메모 |
| date | LocalDate | date | NOT NULL | 지출일 |
| createdAt | LocalDateTime | created_at | NOT NULL | 생성 일시 |

#### Category 값 (예정)

| 값 | 설명 |
|----|------|
| FOOD | 식비 |
| TRANSPORT | 교통 |
| ACCOMMODATION | 숙박 |
| SHOPPING | 쇼핑 |
| ACTIVITY | 활동/관광 |
| OTHER | 기타 |

---

### 3.6 Schedule (여행 일정) - 미구현

**예정 파일 위치**: `domain/schedule/entity/Schedule.java`

#### 필드 정의 (예정)

| 필드명 | 자바 타입 | DB 컬럼 | 제약조건 | 설명 |
|--------|-----------|---------|----------|------|
| seq | Long | seq | PK, AUTO_INCREMENT | 기본키 |
| user | User | user_seq | NOT NULL, FK | 사용자 |
| title | String | title | NOT NULL | 일정 제목 |
| cityName | String | city_name | NULLABLE | 방문 도시 |
| date | LocalDate | date | NOT NULL | 일정 날짜 |
| memo | String | memo | NULLABLE | 메모 |
| createdAt | LocalDateTime | created_at | NOT NULL | 생성 일시 |

---

## 4. Repository 정의

### 4.1 구현완료

| Repository | 엔티티 | 주요 메서드 |
|------------|--------|-------------|
| UserRepository | User | findByEmail, existsByEmail |
| RefreshTokenRepository | RefreshToken | findByToken, findByUser, deleteByUser |

### 4.2 미구현

| Repository | 엔티티 | 예정 메서드 |
|------------|--------|-------------|
| CityRepository | City | findByUser, findByUserAndNameAndCountry |
| ExpenseRepository | Expense | findByUser, findByUserAndDateBetween |
| ScheduleRepository | Schedule | findByUser, findByUserAndDate |

---

## 5. 공통 규칙

### 5.1 명명 규칙

| 항목 | 규칙 | 예시 |
|------|------|------|
| 엔티티 클래스 | PascalCase | User, RefreshToken |
| 테이블명 | snake_case, 복수형 | users, refresh_tokens |
| 컬럼명 | snake_case | created_at, user_seq |
| 기본키 | seq | seq (BIGINT) |
| 외래키 | {테이블}_seq | user_seq |

### 5.2 공통 필드

모든 엔티티에 포함되는 필드:

| 필드 | 타입 | 설명 |
|------|------|------|
| seq | Long | 기본키 (AUTO_INCREMENT) |
| createdAt | LocalDateTime | 생성 일시 (@PrePersist) |

### 5.3 Lombok 어노테이션

| 어노테이션 | 용도 |
|------------|------|
| @Getter | getter 메서드 자동 생성 |
| @NoArgsConstructor(access = PROTECTED) | JPA용 기본 생성자 |
| @Builder | 빌더 패턴 생성자 |

### 5.4 JPA 설정

| 설정 | 개발 | 운영 |
|------|------|------|
| ddl-auto | create-drop | validate |
| show-sql | true | false |
| format_sql | true | false |
