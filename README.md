# 🏪 이웃점빵

> 명지 국제자유방 동네 소상공인을 위한 온라인 홍보 플랫폼

🔗 https://tobyul.github.io/myeongji/

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 19 · Vite · 카카오 지도 API · GitHub Pages (GitHub Actions 배포) |
| 백엔드 | Node.js (Express) · SQL Server |
| 인프라 | IIS + ARR · Let's Encrypt (win-acme) · DuckDNS |

백엔드는 별도 저장소(`rei-neiboring-stores-api-v2`)에서 관리합니다.

---

## 시작하기

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173/myeongji/)
npm run build    # dist/ 에 배포용 빌드
npm run lint     # oxlint 검사
```

로컬에서 API를 호출하려면 API 서버의 `ALLOWED_ORIGINS`에 `http://localhost:5173`을 추가해야 합니다.

---

## 환경 변수

| 이름 | 기본값 | 설명 |
|------|--------|------|
| `VITE_API_BASE_URL` | `vite.config.js` 참고 | API 주소. 로컬 `.env`에 넣으면 덮어씁니다. |
| `VITE_KAKAO_MAP_KEY` | 코드에 포함된 키 | 카카오 지도 JavaScript 키 |

`VITE_`로 시작하는 값은 빌드 결과에 그대로 들어가 누구나 볼 수 있습니다. DB 비밀번호나 비밀 키는 절대 넣지 마세요.

---

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 빌드해서 GitHub Pages에 배포합니다.

- 저장소 Settings → Pages의 Source는 **GitHub Actions**여야 합니다.
- Vite `base`는 `/myeongji/`입니다. 저장소 이름을 바꾸면 `vite.config.js`의 `base`도 함께 바꿔야 합니다.
- 주소는 `#/` 방식(해시 라우팅)을 써서 GitHub Pages에서도 새로고침과 직접 접속이 됩니다.

---

## 주요 화면

| 경로 | 화면 | 권한 |
|------|------|------|
| `#/` | 가게 찾기 (검색, 분야별 보기, 진행 중인 혜택, 새 가게) | 누구나 |
| `#/login`, `#/register` | 로그인, 가입 신청 | 누구나 |
| `#/dashboard` | 관리 메뉴 | 로그인 |
| `#/my-stores`, `#/my-events` | 내 점빵, 내 이벤트 관리 | 승인된 회원 |
| `#/stores`, `#/events`, `#/users` | 전체 가게, 이벤트, 회원 승인 관리 | 관리자 |

---

## 보안

- **로그인**: 토큰 방식이며, 요청할 때마다 서버가 계정 상태를 다시 확인합니다.
- **권한**: 관리자와 점빵 소유 여부는 서버에서 검사합니다. 화면의 메뉴 숨김은 편의 기능일 뿐입니다.
- **HTML 정화**: 가게 소개와 이벤트 내용은 서버에서 저장할 때 한 번, 화면에 표시할 때 한 번 더 허용된 태그만 남깁니다.
- **CSP**: 빌드할 때 `Content-Security-Policy` meta 태그를 자동으로 넣습니다. 인라인 스크립트는 해시로만 허용합니다.
- **업로드**: 로그인 사용자만 가능하며, 실제 이미지인지 검사한 뒤 무작위 이름의 WebP로 저장합니다.

---

## 구조

```
GitHub Pages (tobyul.github.io/myeongji)
        │  HTTPS
        ▼
IIS + ARR (Let's Encrypt)
        │
        ▼
Node.js API ──▶ SQL Server
```

이전 사이트(HTML/JS 버전)는 `tobyul/myeongji-old` 저장소에 보관되어 있습니다.

---

MIT License © Reib
