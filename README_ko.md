# My GeekNews Upvotes

[GeekNews](https://news.hada.io/)에서 추천(Upvote)한 기사를 위한 개인 검색 엔진입니다. 이 애플리케이션을 사용하면 추천한 글들을 스크랩하고, 한글 초성 매칭을 지원하는 빠르고 강력한 퍼지(Fuzzy) 검색 인터페이스를 통해 검색할 수 있습니다.

[English README](README.md)

## 주요 기능

- **증분 스크랩핑 (Incremental Scraping)**: Python 스크립트를 사용하여 새로 추천한 기사만 효율적으로 스크랩합니다.
- **스마트 검색**: 한글 초성 검색을 지원하는 실시간 퍼지 검색을 제공합니다 (예: "ㄱㄴ" 검색 시 "GeekNews" 검색 가능).
- **무한 스크롤**: 자동으로 더 많은 기사를 불러오는 끊김 없는 브라우징 경험을 제공합니다.
- **반응형 UI**: Next.js, Tailwind CSS, Shadcn UI로 구축되어 현대적이고 깔끔한 디자인을 제공합니다.

## 기술 스택

- **프레임워크**: Next.js 15
- **스타일링**: Tailwind CSS, Shadcn UI
- **스크랩핑**: Python 3 (`requests`, `beautifulsoup4`)
- **유틸리티**: `es-hangul` (한글 검색 로직용)

## 시작하기

### 필수 조건

- Node.js 및 npm
- Python 3
- GeekNews 계정

### 1. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 GeekNews 자격 증명을 입력하세요:

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
GEEKNEWS_ID=your_id
PASSWORD=your_password
# 선택 사항
# GEEKNEWS_DATA_PATH=/absolute/path/to/your/data.json
# 또는 원격 URL 사용 (예: GitHub Raw, Gist):
# GEEKNEWS_DATA_PATH=https://gist.githubusercontent.com/Laeyoung/6c56feaba1811eebeb37ab8377775207/raw/cda6da3ee7003247526040693f4b1ced79598fa3/my_geeknews_sample.json
```

### 2. 추천한 기사 스크랩하기

Python 의존성 설치:

```bash
pip install requests beautifulsoup4
```

스크랩핑 스크립트 실행:

```bash
python3 scrape_geeknews.py
```

이 명령은 `data/geeknews_my_upvotes.json` 파일을 생성하거나 업데이트하여 추천한 기사를 저장합니다. `data/` 디렉토리는 개인 데이터를 보호하기 위해 git-ignored 처리되어 있습니다.

### 3. 애플리케이션 실행하기

Node.js 의존성 설치:

```bash
npm install
```

개발 서버 시작:

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 프로젝트 구조

- `scrape_geeknews.py`: 추천한 글을 스크랩하는 Python 스크립트.
- `src/app`: Next.js 앱 라우터 페이지 및 API 라우트.
- `src/components`: React 컴포넌트 (ArticleCard, SearchBar 등).
- `src/lib`: 유틸리티 함수 (퍼지 검색 로직 포함).
- `src/services`: 데이터 페칭 서비스.
