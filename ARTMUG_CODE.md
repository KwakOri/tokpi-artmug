# 아트머그에 붙여 넣을 코드

페이지를 고친 뒤에는 `?v=` 숫자를 하나 올려서 다시 저장한다(GitHub Pages 캐시가 10분쯤 남는다).

## 1. 본문 (에디터를 HTML 모드로 바꾼 상태에서 붙여 넣고, HTML 모드인 채로 저장)

```html
<section name="am-root">
  <div name="fallback" style="padding:24px;border:3px solid #1b1530;border-radius:20px;background:#fff7e8;text-align:center;line-height:1.7;">
    <b style="font-size:20px;">tokpi 채팅창 주문제작</b><br>
    라이트 · 스탠다드 · 프로 / 시안 1개 + 수정 1회<br>
    가격과 작업 기간은 상품 정보를 확인해 주세요.
  </div>
  <div name="stage">
    <iframe src="https://kwakori.github.io/tokpi-artmug/?v=1" width="1180" height="760" scrolling="no" frameborder="0" title="tokpi 채팅창 주문제작" style="display:block;width:100%;max-width:1180px;height:760px;border:0;margin:0 auto;"></iframe>
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
