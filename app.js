(function () {
  'use strict';

  var C = window.TOKPI_CONFIG;
  var SOURCE = 'tokpi-artmug';
  var PARENT_SOURCE = 'tokpi-artmug-parent';
  var embedded = window.parent !== window;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  if (!embedded) document.documentElement.classList.add('standalone');

  function toParent(msg) {
    if (!embedded) return;
    msg.source = SOURCE;
    window.parent.postMessage(msg, '*');
  }

  /* ---------- 부모 페이지 연결: 높이·스크롤·고정 메뉴 ---------- */
  var page = $('.page');
  var nav = $('#nav');
  var lastHeight = 0;
  var viewport = null;

  function sendHeight(force) {
    var h = Math.ceil(page.getBoundingClientRect().height);
    if (!force && Math.abs(h - lastHeight) < 4) return;
    lastHeight = h;
    toParent({ type: 'TOKPI_HEIGHT', height: h });
  }

  function placeNav() {
    if (!embedded || !viewport) return;
    var max = page.offsetHeight - nav.offsetHeight - nav.offsetTop;
    var y = Math.min(Math.max(0, -viewport.iframeTop), Math.max(0, max));
    nav.style.transform = y ? 'translateY(' + y + 'px)' : '';
    nav.classList.toggle('is-floating', y > 0);
  }

  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    var d = e.data || {};
    if (d.source !== PARENT_SOURCE || d.type !== 'TOKPI_VIEWPORT') return;
    viewport = d;
    placeNav();
    markNav();
  });

  function goTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var top = id === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY;
    var navH = nav.offsetHeight;
    if (embedded) toParent({ type: 'TOKPI_SCROLL_TO', top: top, navHeight: navH });
    else window.scrollTo({ top: Math.max(0, top - navH), behavior: 'smooth' });
  }

  $$('[data-go]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      goTo(a.getAttribute('data-go'));
    });
  });

  /* 지금 보고 있는 섹션을 메뉴에 표시 */
  var sections = $$('.nav-links a').map(function (a) { return document.getElementById(a.getAttribute('data-go')); });
  function markNav() {
    var probe = embedded && viewport ? -viewport.iframeTop + nav.offsetHeight + 40 : window.scrollY + nav.offsetHeight + 40;
    var current = null;
    sections.forEach(function (s) { if (s && s.offsetTop <= probe) current = s.id; });
    $$('.nav-links a').forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('data-go') === current); });
  }
  window.addEventListener('scroll', markNav, { passive: true });

  /* ---------- 미리보기 갤러리 ---------- */
  var gallery = $('#gallery');
  function fitPreviews() {
    gallery.classList.toggle('is-scroll', gallery.scrollWidth > gallery.clientWidth + 1);
  }
  if ('ResizeObserver' in window) new ResizeObserver(fitPreviews).observe(gallery);
  window.addEventListener('resize', fitPreviews);
  fitPreviews();

  /* ---------- 구성·가격: 기본 구성 + 옵션, 왼쪽 미리보기 ---------- */
  var won = function (n) { return n.toLocaleString('ko-KR') + '원'; };
  var TBD = '가격 준비 중';
  var state = {};
  C.options.forEach(function (o) { state[o.id] = !!o.on; });

  $$('[data-revision]').forEach(function (el) { el.textContent = C.revision; });

  $('#baseName').textContent = C.base.name;
  $('#baseItems').innerHTML = C.base.items.concat(['수정 ' + C.revision + '회']).map(function (i) { return '<li>' + i + '</li>'; }).join('');
  $('#basePrice').textContent = (C.base.price == null ? TBD : won(C.base.price)) + ' · 작업 기간 약 ' + C.base.days + '일';

  function optPrice(o) {
    if (o.value == null) return TBD;
    return o.kind === 'percent' ? '+' + o.value + '%' : '+' + won(o.value);
  }

  var inputs = {};
  C.options.forEach(function (o) {
    var l = document.createElement('label');
    l.className = 'opt';
    l.innerHTML = '<span><b>' + o.label + '</b><small>' + o.note + ' · ' + optPrice(o) + (o.days ? ' · +' + o.days + '일' : '') + '</small></span>' +
      '<span class="switch"><input type="checkbox" role="switch" value="' + o.id + '"><span class="slider"></span></span>';
    var input = l.querySelector('input');
    input.checked = state[o.id];
    input.addEventListener('change', function () { setOpt(o.id, input.checked); });
    inputs[o.id] = input;
    $(o.preview ? '#visualOpts' : '#extraOpts').appendChild(l);
  });

  function setOpt(id, on) {
    state[id] = on;
    C.options.forEach(function (o) {
      if (on && o.id === id && o.needs) state[o.needs] = true;
      if (!on && o.needs === id) state[o.id] = false;
    });
    C.options.forEach(function (o) { inputs[o.id].checked = state[o.id]; });
    var visual = C.options.some(function (o) { return o.preview && (o.id === id || o.needs === id); });
    if (visual) sendPreview();
    render();
  }

  function chosenOpts() {
    return C.options.filter(function (o) { return state[o.id]; });
  }

  /* 미리보기 iframe: 500×800 화면을 칸 너비에 맞춰 줄인다 */
  var stage = $('#stage');
  var frame = $('#liveFrame');
  var LIVE_W = 500, LIVE_H = 800;
  function previewOpts() {
    var p = {};
    C.options.forEach(function (o) { if (o.preview) p[o.preview] = state[o.id]; });
    return p;
  }
  function fitStage() {
    var k = stage.clientWidth / LIVE_W;
    frame.style.transform = 'scale(' + k + ')';
    stage.style.height = Math.round(LIVE_H * k) + 'px';
  }
  function sendPreview() {
    if (frame.contentWindow) frame.contentWindow.postMessage({ type: 'TOKPI_PREVIEW_OPTS', opts: previewOpts() }, '*');
  }
  var p0 = previewOpts();
  frame.src = 'assets/live/miruru.html?v=1&' + Object.keys(p0).map(function (k) { return k + '=' + (p0[k] ? 1 : 0); }).join('&');
  frame.addEventListener('load', sendPreview);
  if ('ResizeObserver' in window) new ResizeObserver(fitStage).observe(stage);
  window.addEventListener('resize', fitStage);
  fitStage();

  var picked = null;
  function pickRows(opts) {
    var rows = [{ base: true, label: C.base.name, sub: C.base.items.concat(['수정 ' + C.revision + '회']).join(' · '), price: C.base.price == null ? TBD : won(C.base.price) }];
    return rows.concat(opts.map(function (o) { return { label: o.label, price: optPrice(o) }; }));
  }

  function render() {
    var opts = chosenOpts();
    var total = C.base.price;
    var pct = 0;
    opts.forEach(function (o) {
      if (total == null || o.value == null) { total = null; return; }
      if (o.kind === 'percent') pct += o.value; else total += o.value;
    });
    if (total != null) total += Math.round(total * pct / 100);
    $('#sumPrice').textContent = total == null ? TBD : won(total);

    var days = C.base.days;
    opts.forEach(function (o) { days += o.days || 0; });
    if (opts.some(function (o) { return o.half; })) days = Math.ceil(days / 2);
    $('#sumDays').textContent = '작업 기간 약 ' + days + '일';

    var totalText = total == null ? TBD : won(total);
    var daysText = '작업 기간 약 ' + days + '일';
    $('#pickList').innerHTML = pickRows(opts).map(function (r) {
      return '<li' + (r.base ? ' class="is-base"' : '') + '><span><b>' + r.label + '</b>' + (r.sub ? '<small>' + r.sub + '</small>' : '') + '</span><em>' + r.price + '</em></li>';
    }).join('');
    $('#pickPrice').textContent = '예상 ' + totalText;
    $('#pickDays').textContent = daysText;
    picked = { rows: pickRows(opts), total: totalText, days: daysText };
    sendHeight(false);
  }

  $('#daysLine').textContent = '작업 기간 · ' + C.base.name + ' 약 ' + C.base.days + '일, 옵션에 따라 늘어나요 (결제 후부터)';
  render();

  /* ---------- 신청 양식 복사 ---------- */
  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    /* iframe은 내용 높이만큼 길어서 fixed가 화면 밖에 놓인다. 부모 화면 아래쪽에 맞춰 둔다. */
    if (embedded && viewport) {
      el.classList.add('in-frame');
      var bottom = Math.min(page.offsetHeight, -viewport.iframeTop + viewport.viewportHeight);
      el.style.top = Math.max(0, bottom - 110) + 'px';
    }
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2600);
  }

  function buildText() {
    var f = $('#orderForm');
    var v = function (n) { return (f.elements[n].value || '').trim() || '-'; };
    var lines = [
      '[tokpi 채팅창 주문제작 신청]',
      '채널 이름: ' + v('channel'),
      '방송 플랫폼: ' + v('platform'),
      '',
      '[고른 구성]',
    ];
    picked.rows.forEach(function (r) { lines.push('- ' + r.label + (r.sub ? ' (' + r.sub + ')' : '') + ' ' + r.price); });
    lines.push('예상 견적: ' + picked.total + ' · ' + picked.days, '');
    lines.push(
      '원하는 분위기: ' + v('mood'),
      '메인 색: ' + v('color'),
      '로고·캐릭터: ' + v('assets'),
      '참고 자료: ' + v('refs')
    );
    return lines.join('\n');
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  $('#copyBtn').addEventListener('click', function () {
    var text = buildText();
    var done = function () { toast('복사됐어요! 아트머그 문의에 붙여 넣어 주세요'); };
    var fail = function () {
      if (fallbackCopy(text)) done();
      else toast('복사가 안 됐어요. 칸 내용을 직접 옮겨 주세요');
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fail);
    else fail();
  });

  /* ---------- 높이 알리기 ---------- */
  if ('ResizeObserver' in window) new ResizeObserver(function () { sendHeight(false); placeNav(); }).observe(page);
  window.addEventListener('load', function () { sendHeight(true); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { sendHeight(true); });
  $$('img').forEach(function (img) { img.addEventListener('load', function () { sendHeight(false); }); });
  $$('.notice details').forEach(function (d) { d.addEventListener('toggle', function () { sendHeight(false); }); });
  toParent({ type: 'TOKPI_READY' });
  [100, 400, 1000, 2500].forEach(function (ms) { setTimeout(function () { sendHeight(true); }, ms); });
})();
