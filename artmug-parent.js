/*
 * 아트머그 상품 페이지(부모)에서 도는 스크립트. PC·모바일 커스텀 메뉴 칸에 <script src>로 넣는다.
 * - 본문 「내용 더 보기」 접힘을 풀고 버튼을 없앤다.
 * - tokpi iframe이 보내는 높이로 iframe 크기를 맞춘다.
 * - iframe 안 메뉴를 누르면 부모 페이지를 그 위치로 스크롤한다.
 * - 부모 스크롤 위치를 iframe에 알려 iframe 안 메뉴가 화면 위에 붙어 있게 한다.
 */
(function () {
  if (window.__tokpiArtmug) return;
  window.__tokpiArtmug = true;

  var ORIGIN = 'https://kwakori.github.io';
  var SOURCE = 'tokpi-artmug';
  var PARENT_SOURCE = 'tokpi-artmug-parent';
  var MIN_HEIGHT = 700;
  var lastHeight = 0;

  function getIframe() {
    return document.querySelector('[name="am-root"] iframe');
  }

  function injectStyle() {
    if (document.getElementById('tokpi-artmug-style')) return;
    var style = document.createElement('style');
    style.id = 'tokpi-artmug-style';
    style.textContent =
      '[name="am-root"]{text-align:start!important;padding:0!important;margin:0!important;line-height:normal!important;}' +
      '[name="am-root"] [name="stage"]{width:100%;overflow:visible;}' +
      '[name="am-root"] [name="fallback"]{display:none!important;}' +
      '[name="am-root"] iframe{display:block!important;width:100%!important;max-width:1180px;min-height:' + MIN_HEIGHT + 'px;margin:0 auto!important;border:0!important;overflow:hidden;}' +
      '.detailinfo.showstep1,.detailinfo,.detailinfo .showcontent{max-height:none!important;overflow:visible!important;}' +
      '.btn_open_btn,.btn_open,.btn_close{display:none!important;}';
    (document.head || document.documentElement).appendChild(style);
  }

  function unlockDetail() {
    document.querySelectorAll('.detailinfo').forEach(function (box) {
      box.classList.remove('showstep1');
      box.style.maxHeight = 'none';
      box.style.overflow = 'visible';
    });
    document.querySelectorAll('.showcontent').forEach(function (c) {
      c.style.maxHeight = 'none';
      c.style.overflow = 'visible';
    });
    document.querySelectorAll('.btn_open_btn,.btn_open,.btn_close').forEach(function (b) { b.remove(); });
  }

  function resizeIframe(height) {
    var iframe = getIframe();
    if (!iframe) return;
    var h = Math.max(MIN_HEIGHT, Math.ceil(Number(height) || 0));
    if (Math.abs(h - lastHeight) < 4) return;
    lastHeight = h;
    iframe.style.height = h + 'px';
    iframe.setAttribute('height', h);
    sendViewport();
  }

  function sendViewport() {
    var iframe = getIframe();
    if (!iframe || !iframe.contentWindow) return;
    var rect = iframe.getBoundingClientRect();
    iframe.contentWindow.postMessage({
      source: PARENT_SOURCE,
      type: 'TOKPI_VIEWPORT',
      iframeTop: rect.top,
      iframeHeight: rect.height,
      viewportHeight: window.innerHeight || document.documentElement.clientHeight || 0
    }, ORIGIN);
  }

  function scrollTo(top, navHeight) {
    var iframe = getIframe();
    if (!iframe) return;
    var pageTop = (window.scrollY || window.pageYOffset || 0) + iframe.getBoundingClientRect().top;
    var y = Math.max(0, pageTop + Number(top || 0) - Number(navHeight || 0) - 8);
    window.scrollTo({ top: y, behavior: 'smooth' });
    setTimeout(sendViewport, 80);
    setTimeout(sendViewport, 400);
  }

  window.addEventListener('message', function (e) {
    if (e.origin !== ORIGIN) return;
    var iframe = getIframe();
    if (!iframe || e.source !== iframe.contentWindow) return;
    var d = e.data || {};
    if (d.source !== SOURCE) return;
    if (d.type === 'TOKPI_HEIGHT') resizeIframe(d.height);
    else if (d.type === 'TOKPI_SCROLL_TO') scrollTo(d.top, d.navHeight);
    else if (d.type === 'TOKPI_READY') { [50, 300, 1000].forEach(function (ms) { setTimeout(sendViewport, ms); }); }
  });

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; sendViewport(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('orientationchange', function () { setTimeout(sendViewport, 300); });

  function setup() {
    injectStyle();
    unlockDetail();
    sendViewport();
  }

  if (document.readyState !== 'loading') setup();
  else document.addEventListener('DOMContentLoaded', setup);
  [300, 1000, 2000].forEach(function (ms) { setTimeout(setup, ms); });
})();
