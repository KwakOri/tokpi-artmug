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
    $$('.chat-screen').forEach(function (box) {
      box.querySelector('iframe').style.setProperty('--s', (box.clientWidth / 500).toFixed(4));
    });
    gallery.classList.toggle('is-scroll', gallery.scrollWidth > gallery.clientWidth + 1);
  }
  if ('ResizeObserver' in window) new ResizeObserver(fitPreviews).observe(gallery);
  window.addEventListener('resize', fitPreviews);
  fitPreviews();

  /* ---------- 가격·견적 ---------- */
  var won = function (n) { return n.toLocaleString('ko-KR') + '원'; };
  var state = { tier: 'standard', omakase: false, opts: {} };

  $$('[data-revision]').forEach(function (el) { el.textContent = C.revision; });

  var tiersEl = $('#tiers');
  var tierSelect = $('#tierSelect');
  C.tiers.forEach(function (t) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'tier';
    b.setAttribute('data-tier', t.id);
    b.innerHTML =
      (t.badge ? '<span class="tier-badge">' + t.badge + '</span>' : '') +
      '<h3>' + t.name + '</h3>' +
      '<p class="tier-sum">' + t.summary + '</p>' +
      '<p class="tier-price' + (t.price == null ? ' tbd' : '') + '">' + (t.price == null ? '가격 준비 중' : won(t.price)) + '</p>' +
      '<p class="tier-days">작업 기간 약 ' + t.days + '일</p>' +
      '<ul>' + t.items.concat(['수정 ' + C.revision + '회']).map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
    b.addEventListener('click', function () { state.tier = t.id; render(); });
    tiersEl.appendChild(b);

    var o = document.createElement('option');
    o.value = t.id;
    o.textContent = t.name + ' — ' + t.items.join(', ');
    tierSelect.appendChild(o);
  });
  tierSelect.addEventListener('change', function () { state.tier = tierSelect.value; render(); });

  if (C.showOmakase) {
    $('#omakaseBox').hidden = false;
    $('#omakase').addEventListener('change', function (e) { state.omakase = e.target.checked; render(); });
  }

  var optsEl = $('#options');
  C.options.forEach(function (o) {
    var l = document.createElement('label');
    l.className = 'opt';
    var price = o.value == null ? '가격 준비 중' : (o.kind === 'percent' ? '+' + o.value + '%' : '+' + won(o.value));
    l.innerHTML = '<span><b>' + o.label + '</b><small>' + o.note + ' · ' + price + '</small></span>' +
      '<span class="switch"><input type="checkbox" role="switch" value="' + o.id + '"><span class="slider"></span></span>';
    l.querySelector('input').addEventListener('change', function (e) { state.opts[o.id] = e.target.checked; render(); });
    optsEl.appendChild(l);
  });

  function currentTier() {
    return C.tiers.filter(function (t) { return t.id === state.tier; })[0];
  }
  function chosenOpts() {
    return C.options.filter(function (o) { return state.opts[o.id]; });
  }

  function render() {
    var t = currentTier();
    $$('.tier').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-tier') === t.id); });
    tierSelect.value = t.id;

    var base = state.omakase ? t.omakase : t.price;
    var opts = chosenOpts();
    var total = base;
    opts.forEach(function (o) {
      if (total == null || o.value == null) { total = null; return; }
      total += o.kind === 'percent' ? Math.round(base * o.value / 100) : o.value;
    });
    $('#sumPrice').textContent = total == null ? '가격 준비 중' : won(total);

    var days = t.days;
    if (state.opts.rush) days = Math.ceil(days / 2);
    $('#sumDays').textContent = t.name + (state.omakase ? ' · 오마카세' : '') + ' · 작업 기간 약 ' + days + '일';

    $('#optsField').value = opts.map(function (o) { return o.label; }).join(', ');
    sendHeight(false);
  }

  $('#daysLine').textContent = '작업 기간 · ' + C.tiers.map(function (t) { return t.name + ' 약 ' + t.days + '일'; }).join(' / ') + ' (결제 후부터)';
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
    var t = currentTier();
    var lines = [
      '[tokpi 채팅창 주문제작 신청]',
      '채널 이름: ' + v('channel'),
      '방송 플랫폼: ' + v('platform'),
      '단계: ' + t.name + ' (' + t.items.join(', ') + ')',
    ];
    if (C.showOmakase) lines.push('오마카세: ' + (state.omakase ? '네' : '아니요'));
    lines.push(
      '추가 옵션: ' + v('opts'),
      '원하는 분위기: ' + v('mood'),
      '메인 색: ' + v('color'),
      '로고·캐릭터: ' + v('assets'),
      '참고 자료: ' + v('refs'),
      '희망 일정: ' + v('date')
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
