# tokpi-artmug

아트머그 tokpi 채팅창 주문제작 페이지(GitHub Pages): https://kwakori.github.io/tokpi-artmug/

- `index.html`·`style.css`·`app.js`: 아트머그 본문 iframe에 뜨는 페이지
- `config.js`: 가격·옵션 (여기만 고치면 가격표·견적·신청 양식에 반영)
- `artmug-parent.js`: 아트머그 커스텀 메뉴 칸에 넣는 스크립트 (iframe 높이, 접힘 해제, 스크롤, 고정 메뉴)
- `assets/video/`: 갤러리 채팅창 영상(540×960, 18초 반복, webm·mp4·첫 장면 jpg). 마녀·유령 원본은 tokpi-landing `assets/posters/halloween-2026/tokpi-halloween-<witch|ghost>-ko.mp4`, 미루루는 Chat Duck 세트 「미루루 입원 메모」 v4(2026-11-03 게시) chat.css를 site-preview에 넣어 같은 record.mjs 방식으로 녹화(예시 채팅 문구만 미루루용으로 바꿈)
- `assets/live/miruru.html`: 구성·가격 칸의 실시간 미리보기. 미루루 v4 chat.css를 칸별 `<style>`로 나눠 넣었다(`skin` 기본, `sk-fx` 화려한 연출(옵션을 뺀 뒤로 켜지지 않음), `sk-tier` 10만 이상 골드 카드, `sk-rand`·`sk-egg` 랜덤 장식·특급 처방전). 옵션을 끄면 그 칸을 `media="not all"`로 끈다
- `assets/tips/`: 옵션 말풍선 이미지·영상. 미리보기 화면에서 잘라 냄
- `ARTMUG_CODE.md`: 아트머그에 붙여 넣을 코드
- `sheets/`: 슬롯 관리 구글 시트 틀. `slots-public.csv`→「공개」 탭, `slots-manage.csv`→「관리」 탭(탭 이름을 그대로 써야 공개 탭의 예약 수 수식이 관리 탭을 센다). 공개 탭만 「웹에 게시 > CSV」로 게시하고 그 주소를 `config.js`의 `slots.csvUrl`에 넣는다. 시트 전체 공유(링크가 있는 모든 사용자)는 켜지 않는다. 주소가 없으면 슬롯 칸은 숨겨지고, `?slots=demo`로 예시를 볼 수 있다.
