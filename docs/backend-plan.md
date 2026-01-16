# 백엔드 기획안

## 1. 외부 API 연동

| API | 용도 | 추천 서비스 |
|-----|------|-------------|
| 날씨 API | 현재/시간대별 날씨 조회 | OpenWeatherMap |
| 환율 API | 실시간 환율 정보 | 한국수출입은행 API |
| 지오코딩 API | 도시명 → 좌표 변환 | Google Geocoding |
| Google OAuth | 구글 소셜 로그인 | Google Cloud Console |

---

## 2. 도메인 및 API 설계

### 2-1. 인증 도메인 (Auth)

| 엔드포인트 | 메서드 | 인증 | 설명 |
|------------|--------|------|------|
| `/api/auth/signup` | POST | X | 회원가입 |
| `/api/auth/login` | POST | X | 로그인 (JWT 발급) |
| `/api/auth/google` | POST | X | 구글 로그인 (OAuth) |
| `/api/auth/refresh` | POST | X | Access Token 재발급 |
| `/api/auth/logout` | POST | O | 로그아웃 (Refresh Token 무효화) |
| `/api/auth/me` | GET | O | 내 정보 조회 |

### 2-2. 날씨 도메인 (Weather)

| 엔드포인트 | 메서드 | 인증 | 설명 |
|------------|--------|------|------|
| `/api/weather/current` | GET | X | 현재 위치 날씨 (위도/경도 파라미터) |
| `/api/weather/hourly` | GET | X | 시간대별 날씨 |
| `/api/weather/city/{cityName}` | GET | X | 도시명으로 날씨 조회 |

### 2-3. 도시 저장 도메인 (City)

| 엔드포인트 | 메서드 | 인증 | 설명 |
|------------|--------|------|------|
| `/api/cities` | GET | O | 저장된 도시 목록 |
| `/api/cities` | POST | O | 도시 저장 |
| `/api/cities/{id}` | DELETE | O | 도시 삭제 |

### 2-4. 경비 도메인 (Expense)

| 엔드포인트 | 메서드 | 인증 | 설명 |
|------------|--------|------|------|
| `/api/expenses` | GET | O | 지출 목록 조회 |
| `/api/expenses` | POST | O | 지출 기록 추가 |
| `/api/expenses/{id}` | PUT | O | 지출 수정 |
| `/api/expenses/{id}` | DELETE | O | 지출 삭제 |
| `/api/exchange-rate` | GET | X | 환율 정보 조회 |

### 2-5. 일정 도메인 (Schedule)

| 엔드포인트 | 메서드 | 인증 | 설명 |
|------------|--------|------|------|
| `/api/schedules` | GET | O | 일정 목록 조회 |
| `/api/schedules` | POST | O | 일정 추가 |
| `/api/schedules/{id}` | PUT | O | 일정 수정 |
| `/api/schedules/{id}` | DELETE | O | 일정 삭제 |

---

## 3. 데이터베이스

### 3-0. DB 선택

| 구분 | 내용 |
|------|------|
| DBMS | MySQL |
| 개발용 | H2 Database (인메모리) |
| 선택 이유 | 사용자-도시, 사용자-경비, 사용자-일정 간 관계 매핑에 RDB 적합 |

### 3-1. User (사용자)

```
User
├── id: Long (PK)
├── email: String (UNIQUE, 이메일)
├── password: String (암호화된 비밀번호, OAuth 사용자는 null)
├── nickname: String (닉네임)
├── provider: String (LOCAL, GOOGLE)
├── providerId: String (OAuth 제공자의 사용자 ID)
├── createdAt: LocalDateTime (가입일시)
└── updatedAt: LocalDateTime (수정일시)
```

### 3-2. City (도시 즐겨찾기)

```
City
├── id: Long (PK)
├── userId: Long (FK → User)
├── name: String (도시명)
├── country: String (국가)
├── latitude: Double (위도)
├── longitude: Double (경도)
└── createdAt: LocalDateTime (생성일시)
```

### 3-3. Expense (지출 기록)

```
Expense
├── id: Long (PK)
├── userId: Long (FK → User)
├── amount: BigDecimal (금액)
├── currency: String (통화: KRW, USD, JPY 등)
├── category: String (카테고리: 식비, 교통, 쇼핑 등)
├── memo: String (메모)
├── date: LocalDate (지출일)
└── createdAt: LocalDateTime (생성일시)
```

### 3-4. Schedule (여행 일정)

```
Schedule
├── id: Long (PK)
├── userId: Long (FK → User)
├── title: String (일정 제목)
├── cityName: String (방문 도시)
├── date: LocalDate (일정 날짜)
├── memo: String (메모)
└── createdAt: LocalDateTime (생성일시)
```

### 3-5. RefreshToken (리프레시 토큰)

```
RefreshToken
├── id: Long (PK)
├── userId: Long (FK → User)
├── token: String (토큰 값)
├── expiryDate: LocalDateTime (만료일시)
└── createdAt: LocalDateTime (생성일시)
```

### 3-6. ERD

```
┌─────────┐       ┌─────────────┐
│  User   │───────│RefreshToken │
└────┬────┘       └─────────────┘
     │
     ├──────────────┬──────────────┐
     │              │              │
     ▼              ▼              ▼
┌─────────┐   ┌─────────┐   ┌──────────┐
│  City   │   │ Expense │   │ Schedule │
└─────────┘   └─────────┘   └──────────┘
```

---

## 4. 인증 흐름

### 4-1. JWT 구조

| 토큰 | 유효기간 | 저장 위치 | 용도 |
|------|----------|-----------|------|
| Access Token | 30분 | SecureStore (앱) | API 인증 |
| Refresh Token | 14일 | SecureStore (앱) + DB | Access Token 재발급 |

> **모바일 앱 토큰 저장**: Expo SecureStore 사용 (iOS Keychain / Android Keystore 기반 암호화)
> - 앱 종료 후에도 로그인 상태 유지
> - OS 레벨 암호화로 보안 확보

### 4-2. 일반 로그인 흐름

```
1. 사용자 → /api/auth/login (email, password)
2. 서버: 비밀번호 검증 → JWT 발급
3. 응답: { accessToken, refreshToken }
```

### 4-3. 구글 로그인 흐름

```
1. 프론트엔드: Google OAuth 로그인 → ID Token 획득
2. 프론트엔드 → /api/auth/google (idToken)
3. 서버: Google ID Token 검증
4. 서버: 사용자 조회 또는 자동 회원가입
5. 서버: JWT 발급
6. 응답: { accessToken, refreshToken }
```

### 4-4. 토큰 재발급 흐름

```
1. Access Token 만료 감지
2. 클라이언트 → /api/auth/refresh (refreshToken)
3. 서버: Refresh Token 검증
4. 응답: { accessToken } (새 Access Token)
```

---

## 5. 필요 의존성

| 의존성 | 용도 |
|--------|------|
| Spring Web | REST API 구현 |
| Spring Data JPA | 데이터베이스 연동 |
| Spring Security | 인증/인가 |
| jjwt (io.jsonwebtoken) | JWT 생성/검증 |
| Google API Client | 구글 OAuth 토큰 검증 |
| MySQL Driver | MySQL 연동 |
| H2 Database | 개발용 인메모리 DB |
| Lombok | 보일러플레이트 코드 감소 |
| WebClient | 외부 API 호출 |
| BCrypt | 비밀번호 암호화 |

---

## 6. 프로젝트 구조

```
backend/
├── src/main/java/com/traveler/
│   ├── TravelerApplication.java
│   ├── config/                    # 설정 클래스
│   │   ├── SecurityConfig.java
│   │   ├── WebClientConfig.java
│   │   └── CorsConfig.java
│   ├── domain/
│   │   ├── auth/                  # 인증 도메인
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── entity/
│   │   │   └── dto/
│   │   ├── user/                  # 사용자 도메인
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── entity/
│   │   │   └── dto/
│   │   ├── weather/               # 날씨 도메인
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   └── dto/
│   │   ├── city/                  # 도시 도메인
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── entity/
│   │   │   └── dto/
│   │   ├── expense/               # 경비 도메인
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── entity/
│   │   │   └── dto/
│   │   └── schedule/              # 일정 도메인
│   │       ├── controller/
│   │       ├── service/
│   │       ├── repository/
│   │       ├── entity/
│   │       └── dto/
│   ├── global/                    # 공통 모듈
│   │   ├── exception/
│   │   ├── response/
│   │   └── security/
│   │       ├── jwt/
│   │       │   ├── JwtTokenProvider.java
│   │       │   └── JwtAuthenticationFilter.java
│   │       └── oauth/
│   │           └── GoogleTokenVerifier.java
└── src/main/resources/
    └── application.yml
```

---

## 7. 개발 순서

1. 프로젝트 구조 설정 및 의존성 추가
2. Spring Security + JWT 설정
3. User 엔티티 및 인증 API 구현
4. 구글 OAuth 연동
5. 나머지 엔티티 및 Repository 생성 (City, Expense, Schedule)
6. 날씨 API 연동
7. 환율 API 연동
8. 각 도메인별 Controller/Service 구현
9. 예외 처리 및 응답 형식 통일
