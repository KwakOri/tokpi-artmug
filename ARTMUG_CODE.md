# 아트머그에 붙여 넣을 코드

페이지를 고친 뒤에는 `?v=` 숫자를 하나 올려서 다시 저장한다(GitHub Pages 캐시가 10분쯤 남는다).

## 1. 본문 (에디터를 HTML 모드로 바꾼 상태에서 붙여 넣고, HTML 모드인 채로 저장)

```html
<section name="am-root">
  <div name="fallback" style="padding:24px;border:3px solid #1b1530;border-radius:20px;background:#fff7e8;text-align:center;line-height:1.7;">
    <b style="font-size:20px;">tokpi 채팅창 주문제작</b><br>
    기본 구성(시청자 채팅 1종 · 시안 제공 · 수정 2회) + 디자인 옵션<br>
    가격은 상품 정보를 확인해 주세요.
  </div>
  <div name="stage">
    <iframe src="https://kwakori.github.io/tokpi-artmug/?v=3" width="1180" height="760" scrolling="no" frameborder="0" allow="clipboard-write" title="tokpi 채팅창 주문제작" style="display:block;width:100%;max-width:1180px;height:760px;border:0;margin:0 auto;"></iframe>
  </div>
</section>
```

`fallback` 상자는 커스텀 메뉴 스크립트가 돌면 숨겨진다. 스크립트가 막혔을 때만 보인다.

## 2. PC 커스텀 메뉴

```html
<script src="https://kwakori.github.io/tokpi-artmug/artmug-parent.js?v=1"></script>
```

## 3. 모바일 커스텀 메뉴

```html
<script src="https://kwakori.github.io/tokpi-artmug/artmug-parent.js?v=1"></script>
```

## 가격을 정하면

`config.js`의 `price`·`omakase`·옵션 `value`를 채우고, 오마카세를 보이려면 `showOmakase: true`로 바꾼다.
아트머그 상품 정보의 가격·작업 기간 칸도 같은 숫자로 맞춘다.

## 커스텀 메뉴 칸이 저장 때 비워질 때 (2026-11-04 확인)

아트머그가 커스텀 메뉴 칸의 `<script>`를 지운다(PC·모바일 둘 다 빈칸으로 저장됨).

### A. 본문 끝에 스크립트를 같이 넣어 보기

1번 본문 코드 맨 아래(`</section>` 뒤)에 커스텀 메뉴용 `<script src=…artmug-parent.js?v=1>` 줄을 붙여 HTML 모드로 저장한다.
저장 뒤 노란 안내 상자가 사라지고 iframe이 끝까지 펼쳐지면 성공. 상자가 그대로면 본문에서도 스크립트가 지워진 것 → B.

### B. 스크립트 없이 (iframe 안에서 스크롤)

```html
<section name="am-root">
  <div name="stage">
    <iframe src="https://kwakori.github.io/tokpi-artmug/?solo=1&v=4" width="1180" height="760" scrolling="yes" frameborder="0" allow="clipboard-write" title="tokpi 채팅창 주문제작" style="display:block;width:100%;max-width:1180px;height:85vh;min-height:640px;border:0;margin:0 auto;"></iframe>
  </div>
</section>
```

`?solo=1`이면 페이지가 부모 스크립트를 기다리지 않고 단독 페이지처럼 돈다: 메뉴·미리보기 따라오기·말풍선·팝업이 iframe 안 스크롤 기준.
iframe 높이는 화면의 85%로 고정, 그 안에서 스크롤한다. 「내용 더 보기」 접힘은 못 푼다(손님이 눌러야 펼쳐짐).
