# 데이터베이스 설계서

## 1. 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | Traveler App |
| DBMS | MySQL 8.x (운영), H2 (개발) |
| ORM | Spring Data JPA + Hibernate |
| 작성일 | 2026-01-19 |

---

## 2. ERD (Entity Relationship Diagram)

```
┌─────────────────┐
│      users      │
├─────────────────┤
│ PK  seq         │
│     email       │
│     password    │
│     nickname    │
│     provider    │
│     provider_id │
│     created_at  │
│     updated_at  │
│     last_login_at│
│     is_active   │
└────────┬────────┘
         │
         │ 1:N
         │
         ├──────────────────────────────────────────────┐
         │                      │                       │
         ▼                      ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ refresh_tokens  │   │     cities      │   │    expenses     │
├─────────────────┤   ├─────────────────┤   ├─────────────────┤
│ PK  seq         │   │ PK  seq         │   │ PK  seq         │
│ FK  user_seq    │   │ FK  user_seq    │   │ FK  user_seq    │
│     token       │   │     name        │   │     amount      │
│     expiry_date │   │     country     │   │     currency    │
│     created_at  │   │     latitude    │   │     category    │
└─────────────────┘   │     longitude   │   │     memo        │
                      │     created_at  │   │     date        │
                      └─────────────────┘   │     created_at  │
                                            └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│    schedules    │
├─────────────────┤
│ PK  seq         │
│ FK  user_seq    │
│     title       │
│     city_name   │
│     date        │
│     memo        │
│     created_at  │
└─────────────────┘
```

---

## 3. 테이블 정의

### 3.1 users (사용자)

사용자 정보를 저장하는 테이블

| 컬럼명 | 데이터 타입 | NULL | 기본값 | 설명 |
|--------|-------------|------|--------|------|
| seq | BIGINT | NO | AUTO_INCREMENT | 기본키 |
| email | VARCHAR(255) | NO | - | 이메일 (UNIQUE) |
| password | VARCHAR(255) | YES | NULL | 암호화된 비밀번호 (OAuth 사용자는 NULL) |
| nickname | VARCHAR(255) | NO | - | 닉네임 |
| provider | ENUM('LOCAL', 'GOOGLE') | NO | - | 인증 제공자 |
| provider_id | VARCHAR(255) | YES | NULL | OAuth 제공자의 사용자 ID |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 가입 일시 |
| updated_at | TIMESTAMP | YES | NULL | 수정 일시 |
| last_login_at | TIMESTAMP | YES | NULL | 마지막 로그인 일시 |
| is_active | BOOLEAN | NO | TRUE | 계정 활성화 상태 |

**인덱스:**
- PRIMARY KEY (seq)
- UNIQUE INDEX (email)

**DDL:**
```sql
CREATE TABLE users (
    seq BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    nickname VARCHAR(255) NOT NULL,
    provider ENUM('LOCAL', 'GOOGLE') NOT NULL,
    provider_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
```

---

### 3.2 refresh_tokens (리프레시 토큰)

JWT 리프레시 토큰을 저장하는 테이블

| 컬럼명 | 데이터 타입 | NULL | 기본값 | 설명 |
|--------|-------------|------|--------|------|
| seq | BIGINT | NO | AUTO_INCREMENT | 기본키 |
| user_seq | BIGINT | NO | - | 사용자 FK |
| token | VARCHAR(512) | NO | - | 리프레시 토큰 값 (UNIQUE) |
| expiry_date | TIMESTAMP | NO | - | 토큰 만료 일시 |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 생성 일시 |

**인덱스:**
- PRIMARY KEY (seq)
- UNIQUE INDEX (token)
- INDEX (user_seq)

**외래키:**
- user_seq → users(seq) ON DELETE CASCADE

**DDL:**
```sql
CREATE TABLE refresh_tokens (
    seq BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_seq BIGINT NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_seq) REFERENCES users(seq) ON DELETE CASCADE
);
```

---

### 3.3 cities (즐겨찾기 도시)

사용자가 저장한 도시 정보

| 컬럼명 | 데이터 타입 | NULL | 기본값 | 설명 |
|--------|-------------|------|--------|------|
| seq | BIGINT | NO | AUTO_INCREMENT | 기본키 |
| user_seq | BIGINT | NO | - | 사용자 FK |
| name | VARCHAR(255) | NO | - | 도시명 |
| country | VARCHAR(255) | NO | - | 국가명 |
| latitude | DOUBLE | NO | - | 위도 |
| longitude | DOUBLE | NO | - | 경도 |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 생성 일시 |

**인덱스:**
- PRIMARY KEY (seq)
- INDEX (user_seq)
- UNIQUE INDEX (user_seq, name, country) - 중복 저장 방지

**외래키:**
- user_seq → users(seq) ON DELETE CASCADE

**DDL:**
```sql
CREATE TABLE cities (
    seq BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_seq BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_seq) REFERENCES users(seq) ON DELETE CASCADE,
    UNIQUE KEY uk_user_city (user_seq, name, country)
);
```

---

### 3.4 expenses (지출 기록)

여행 경비 기록 테이블

| 컬럼명 | 데이터 타입 | NULL | 기본값 | 설명 |
|--------|-------------|------|--------|------|
| seq | BIGINT | NO | AUTO_INCREMENT | 기본키 |
| user_seq | BIGINT | NO | - | 사용자 FK |
| amount | DECIMAL(15,2) | NO | - | 금액 |
| currency | VARCHAR(3) | NO | 'KRW' | 통화 코드 (KRW, USD, JPY 등) |
| category | VARCHAR(50) | NO | - | 카테고리 (식비, 교통, 숙박, 쇼핑, 기타) |
| memo | VARCHAR(500) | YES | NULL | 메모 |
| date | DATE | NO | - | 지출일 |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 생성 일시 |

**인덱스:**
- PRIMARY KEY (seq)
- INDEX (user_seq)
- INDEX (user_seq, date) - 날짜별 조회 최적화

**외래키:**
- user_seq → users(seq) ON DELETE CASCADE

**DDL:**
```sql
CREATE TABLE expenses (
    seq BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_seq BIGINT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
    category VARCHAR(50) NOT NULL,
    memo VARCHAR(500),
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_seq) REFERENCES users(seq) ON DELETE CASCADE,
    INDEX idx_user_date (user_seq, date)
);
```

---

### 3.5 schedules (여행 일정)

여행 일정 관리 테이블

| 컬럼명 | 데이터 타입 | NULL | 기본값 | 설명 |
|--------|-------------|------|--------|------|
| seq | BIGINT | NO | AUTO_INCREMENT | 기본키 |
| user_seq | BIGINT | NO | - | 사용자 FK |
| title | VARCHAR(255) | NO | - | 일정 제목 |
| city_name | VARCHAR(255) | YES | NULL | 방문 도시 |
| date | DATE | NO | - | 일정 날짜 |
| memo | TEXT | YES | NULL | 메모 |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | 생성 일시 |

**인덱스:**
- PRIMARY KEY (seq)
- INDEX (user_seq)
- INDEX (user_seq, date) - 날짜별 조회 최적화

**외래키:**
- user_seq → users(seq) ON DELETE CASCADE

**DDL:**
```sql
CREATE TABLE schedules (
    seq BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_seq BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    city_name VARCHAR(255),
    date DATE NOT NULL,
    memo TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_seq) REFERENCES users(seq) ON DELETE CASCADE,
    INDEX idx_user_date (user_seq, date)
);
```

---

## 4. 관계 정의

| 부모 테이블 | 자식 테이블 | 관계 | 설명 |
|-------------|-------------|------|------|
| users | refresh_tokens | 1:N | 한 사용자는 여러 리프레시 토큰을 가질 수 있음 (다중 기기) |
| users | cities | 1:N | 한 사용자는 여러 도시를 즐겨찾기 할 수 있음 |
| users | expenses | 1:N | 한 사용자는 여러 지출 기록을 가질 수 있음 |
| users | schedules | 1:N | 한 사용자는 여러 일정을 가질 수 있음 |

---

## 5. 환경별 설정

### 5.1 개발 환경 (H2)

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:travelerdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
```

### 5.2 운영 환경 (MySQL)

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/travelerdb
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate
```

---

## 6. 데이터 무결성 규칙

1. **사용자 삭제 시**: 연관된 모든 데이터 CASCADE 삭제
2. **이메일 중복 금지**: UNIQUE 제약조건
3. **도시 중복 저장 금지**: 동일 사용자가 같은 도시를 중복 저장 불가
4. **금액 정밀도**: DECIMAL(15,2)로 소수점 2자리까지 지원
5. **필수값 검증**: NOT NULL 제약조건으로 필수 데이터 보장
