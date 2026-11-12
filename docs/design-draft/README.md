# 이미지 시안: 원본 부스 이미지 교체

이 사이트의 이미지 일부는 원본 부스 화면(Microsoft 행사용 체험 사이트)에서 그대로 가져온 것입니다.
체험존의 분위기(밝은 파스텔 배경, 둥근 카드, 큰 제목)와 Microsoft 제품 화면은 그대로 두고, **원본 부스가 직접 만든 그래픽만 새로 그린 것으로 바꾸는 시안**입니다.

- 기본 화면은 바뀌지 않았습니다. 주소에 `?look=draft` 를 붙이면 시안이 보입니다.
  - 개발 서버: `http://localhost:5173/?look=draft#/`
  - 더블클릭 폴더: `index.html?look=draft#/` (같은 폴더의 `시안 보기.html` 을 열어도 됩니다)
- 비교 이미지: `compare-1-screens.jpg`(대기·홈·목록·흐름), `compare-2-scenes.jpg`(상황 그림·아이콘·포스터)

## 교체 대상과 시안 범위

| 구분 | 지금 쓰는 파일 | 시안에서 바꾼 것 | 본 작업 때 할 일 |
|---|---|---|---|
| 대기 화면 배경 영상·정지 화면 | `public/brand/hero/*` | 코드로 그린 그래픽: 업무 카드(엑셀·워드·PPT·메일·Teams)가 Copilot 주위에 떠 있는 장면 (`src/screens/DraftArt.tsx`) | 기본값으로 바꾸고 원본 파일 삭제 |
| 홈 배경 | `src/assets/gradient/sky-07.jpg` | CSS 그라데이션 + SVG 노이즈 (`src/styles/draft.css`) | 같음 |
| 흐름·결과 화면 배경 | `src/assets/gradient/sky-02.jpg` | CSS 그라데이션 + SVG 노이즈 | 같음 |
| 업무 영역 목록 상단 그래픽 | `public/brand/signiture/copilot-signature.png` | 영역 색으로 칠한 둥근 카드 그래픽 | 같음 |
| 의미 아이콘 30종(상황·흐름·요약) | `src/components/semanticIcons.ts` | Fluent UI System Icons(MIT 라이선스, 이미 쓰는 패키지)로 전부 교체 | 원본 아이콘 파일 삭제 |
| 상황 화면 그림 | `src/play/sceneArt.ts` (24종 중 15종 사용) | **3종** 새로 그림: 견적 비교, 지원서 정리, 납기 지연 (`src/play/sceneArtDraft.ts`) | 나머지 12종 새로 그리기. 안 쓰는 9종은 확장 작업 때 필요한 것만 새로 그리기 |
| 포스터 시나리오 이미지 6장 | `public/graphic/event-poster/*` | 6장 모두 새로 그림 (`public/draft/poster/`, 원본 SVG는 `poster-src/`) | 시나리오 경로를 새 파일로 바꾸고 원본 삭제 |

시안 이미지는 모두 이 저장소에서 코드(SVG·CSS)로 새로 만든 것이라, 외부 이미지나 생성형 이미지 저작권 문제가 없습니다. 포스터는 시나리오 문구(1번 손이 모이는 구도와 연한 주황 #FAD4AC, 2번 밤하늘 전구 #171A5D, 브랜드 적용본은 앰버·네이비, 티셔츠는 3색)에 맞춰 그렸습니다.

## 그대로 두는 것

- Copilot 로고, Microsoft 365 앱 아이콘, Copilot 앱·Office 창 같은 **제품 화면 모양**: 제품을 소개하는 데 필요한 부분이라 유지합니다. 외부에 공개할 때는 Microsoft 상표·브랜드 사용 지침을 확인하세요.
- 홈 카드 아이콘(Fluent UI, MIT), 글꼴 Pretendard(OFL).

## 이미지 말고도 원본에서 그대로 가져온 것 (결정 필요)

- **화면 스타일 파일** `src/styles/reference.css`: 원본 부스의 CSS를 그대로 복사했습니다. 제품 화면을 재현하는 부분 외에 부스 고유 디자인(홈 카드의 기울어진 모양, 대기 화면·상황 화면 배치, 애니메이션)도 들어 있습니다. 이 부분을 다시 쓸지 정해야 합니다.
- **문구** "Work lighter"(상황 화면의 "Copilot과 해보기" 버튼 옆): 원본 부스에 있던 문구입니다.

※ 저작권·상표 판단은 법률 자문이 아닙니다. 외부 행사나 고객사에 공개하기 전에 담당 부서와 확인하세요.
