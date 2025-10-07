# ㈜다성 입고관리 Tool - Next.js 버전

## 개요
㈜다성 입고관리 Tool의 Next.js 버전입니다. Supabase를 사용하여 재고 관리를 위한 웹 애플리케이션입니다.

## 주요 기능
- ✅ 업체선택 기능 (드롭다운)
- ✅ 월 단위 데이터 관리
- ✅ 자동정렬 기능 제거
- ✅ 텍스트 자동 폭 조절
- ✅ 웹 기반 인터페이스
- ✅ Supabase PostgreSQL 연동
- ✅ 반응형 디자인 (Tailwind CSS)
- ✅ TypeScript 타입 안정성

## 기술 스택
- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Deployment**: Vercel

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하세요.

## 데이터베이스 구조

### order_register (기본 재고 정보)
- id: 기본키
- company: 업체명
- chajong: 차종
- pumbeon: 품번
- pm: 품명
- in_qty: 입고수량
- out_qty: 반출수량
- stock_qty: 재고수량
- order_qty: 발주수량
- remark: 비고

### in_register (입고 이력)
- id: 기본키
- order_id: order_register 외래키
- in_date: 입고일자
- in_count: 입고수량

### monthly_data (월별 데이터)
- id: 기본키
- year_month: 년월 (YYYY-MM)
- order_id: order_register 외래키
- in_qty: 월별 입고수량
- out_qty: 월별 반출수량
- stock_qty: 월별 재고수량
- order_qty: 월별 발주수량

## 배포

### Vercel 배포
1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 연결
3. 환경변수 설정
4. 자동 배포 완료

## 주요 개선사항
- Python Flask → Next.js 전환으로 Vercel 최적화
- 서버리스 함수 호환성 문제 해결
- TypeScript로 타입 안정성 확보
- Tailwind CSS로 반응형 디자인
- Supabase 클라이언트 라이브러리 사용으로 안정성 향상