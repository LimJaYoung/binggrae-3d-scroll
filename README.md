# Banana Milk · Interactive 3D

바나나맛우유 GLB 모델을 활용한 웹 인터랙션 콘셉트 데모입니다. 공식 브랜드 사이트가 아닙니다.

- 스크롤에 따른 모델 회전, 이동, 확대
- 드래그·방향키로 상하·좌우 360° 회전
- 자동 회전, 크기 조절, 정면 복원
- 모바일: 병 위에서 드래그로 회전, 병 바깥에서 스와이프로 스크롤

## 로컬 실행

Node.js 22 권장.

```sh
npm ci
npm run dev
```

## 빌드와 배포

```sh
npm run build
npm run preview
```

GitHub Pages는 main 브랜치의 `docs/` 폴더를 배포합니다. 변경 후 `npm run build`를 실행하고 dist의 결과물을 docs에 반영해 push합니다.

웹용 모델: `output/banana-milk.glb`. 원본 Blender 파일과 렌더 영상은 웹 실행에 필요하지 않아 포함하지 않습니다.

## 브라우저 검증

```sh
npx playwright install chromium
npx playwright test
```

테스트 실행 시 로컬 개발 서버가 5173 포트에서 실행 중이어야 합니다.
