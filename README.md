# 📄 AI Resume & Portfolio Builder

> **구글 Gemini AI 기반 맞춤형 국문 이력서 & 포트폴리오 자동 생성 웹 애플리케이션**

사용자가 이름, 지원 직무, 경력 사항, 프로젝트 경험, 원하는 어조(Tone), 작성 모드 및 디자인 템플릿을 입력하면, Flask 백엔드가 Google Gemini API를 호출하여 전문적인 이력서와 포트폴리오를 실시간으로 작성해 주는 풀스택 웹 애플리케이션입니다.

---

## 🌟 주요 기능 (Key Features)

1. **맞춤형 정보 입력 폼**
   - 이름, 지원 직무, 주요 경력, 프로젝트 경험, 어조(Tone) 입력
   - 사용자 친화적인 유효성 검사 (프론트엔드 및 백엔드 이중 검증)

2. **프롬프트 엔지니어링 (A/B 모드)**
   - **Prompt A (일반 모드)**: 신입 및 주니어 구직자를 위한 균형 잡힌 표준 구성과 성장 잠재력 중심 서술
   - **Prompt B (전문가 모드)**: 경력직 및 시니어를 위한 STAR(상황-과제-행동-결과) 기법 및 정량적 성과 중심 서술

3. **시각적 디자인 템플릿 선택기**
   - **모던 오렌지 2단형 (추천 샘플)**: 프로필 사진 및 사이드바가 강조된 트렌디한 비주얼 이력서
   - **클래식 베이지 표준형**: 차분하고 신뢰감을 주는 전통적인 1단 문서 양식
   - **심플 모노크롬형**: 경력과 성과에 집중하는 담백한 흑백 양식

4. **실시간 마크다운 동적 렌더링 (`marked.js`)**
   - AI가 생성한 마크다운 기호(`#`, `*`, `---`)를 브라우저가 자동 해석하여 노션/워드 문서 스타일로 깔끔하게 렌더링

5. **편의 기능**
   - **원클릭 클립보드 복사**: 이력서와 포트폴리오를 각각 버튼 클릭 한 번으로 복사
   - **마크다운(.md) 파일 다운로드**: `이름_직무_이력서_포트폴리오.md` 파일로 컴퓨터에 즉시 저장

6. **따뜻한 감성 디자인 & 완벽한 모바일 연동**
   - 눈이 편안한 웜 베이지 & 모카 테마 디자인
   - iOS 사파리 줌 방지, 엄지 터치 최적화 등 모바일 반응형 UI 완벽 지원
   - 로컬 Wi-Fi 네트워크 개방(`host="0.0.0.0"`)으로 스마트폰 브라우저에서 직접 접속 및 사용 가능

7. **철저한 보안 관리**
   - 민감한 Gemini API Key는 `.env` 파일로 로컬에서만 관리되며, `.gitignore`를 통해 Git 추적에서 원천 제외

---

## 🛠 기술 스택 (Tech Stack)

| 영역 | 사용 기술 |
| :--- | :--- |
| **Backend** | Python 3.x, Flask, `python-dotenv`, `google-genai` |
| **AI Model** | Google Gemini API (`gemini-3.5-flash-lite`) |
| **Frontend** | HTML5, Semantic CSS3 (Warm Beige Theme), Modern Vanilla JavaScript |
| **Libraries** | `marked.js` (마크다운 렌더링) |
| **VCS** | Git, GitHub |

---

## 📁 프로젝트 폴더 구조

```text
resume-builder/
├── app.py                  # Flask 메인 백엔드 서버 및 Gemini API 연동
├── requirements.txt        # 프로젝트 종속 패키지 목록
├── .env                    # 실제 환경변수 및 비밀 API Key (Git 제외)
├── .env.example            # 환경변수 설정 가이드 견본
├── .gitignore              # Git 추적 제외 설정 파일
├── README.md               # 프로젝트 상세 안내 문서
├── sample/                 # 디자인 샘플 이미지 보관 폴더
│   └── sample1.png.PNG
├── static/
│   ├── css/
│   │   └── style.css       # 웜 베이지 모던 카드 테마 & 모바일 반응형 스타일시트
│   ├── img/
│   │   └── sample1.png     # 템플릿 선택용 썸네일 이미지
│   └── js/
│       └── app.js          # 폼 비동기 통신, 마크다운 파싱, 복사/다운로드 스크립트
└── templates/
    └── index.html          # 메인 웹 페이지 화면 템플릿
```

---

## 🚀 빠른 시작 가이드 (Getting Started)

### 1. 가상환경 생성 및 활성화 (Windows PowerShell 기준)
```powershell
# 프로젝트 폴더로 이동
cd C:\AI-study\resume-builder

# 가상환경 생성
py -m venv venv

# 가상환경 활성화
.\venv\Scripts\Activate.ps1
```
*(프롬프트 맨 앞에 `(venv)`가 나타나는지 확인합니다.)*

### 2. 패키지 설치
```powershell
py -m pip install -r requirements.txt
```

### 3. Gemini API Key 환경변수 설정
1. `.env.example` 파일을 복사하여 `.env` 파일을 생성합니다.
```powershell
Copy-Item .env.example .env
```
2. `.env` 파일을 열고 본인의 실제 Gemini API Key를 입력합니다:
```text
GEMINI_API_KEY=AIzaSy...본인의_실제_API_키
```

### 4. 서버 실행
```powershell
py app.py
```

### 5. 브라우저 접속
- **PC 브라우저 접속 주소**: [http://127.0.0.1:5000](http://127.0.0.1:5000)
- **스마트폰 모바일 접속 주소**: `http://[내_컴퓨터_IP_주소]:5000` (동일 Wi-Fi 연결 시)

---

## 🔒 보안 주의사항 (Security)

- 본 프로젝트의 `.env` 파일은 실제 API Key를 포함하므로 **절대로 GitHub 등 공개 저장소에 푸시(Push)하지 마세요.**
- 이미 `.gitignore`에 등록되어 있어 안전하게 제외 처리되어 있습니다.

---

## 📄 라이선스 (License)

This project is open-source and available under the [MIT License](LICENSE).
