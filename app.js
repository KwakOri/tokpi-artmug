(function () {
  'use strict';

  var C = window.TOKPI_CONFIG;
  var SOURCE = 'tokpi-artmug';
  var PARENT_SOURCE = 'tokpi-artmug-parent';
  /* ?solo=1: 부모 페이지 스크립트 없이 iframe 안에서 스스로 스크롤하는 방식(아트머그가 스크립트를 지울 때). 단독 페이지처럼 동작 */
  var embedded = window.parent !== window && !/[?&]solo=1(&|$)/.test(location.search);
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
    placeStage();
  }

  /* 견적 칸의 미리보기가 스크롤을 따라 내려온다(넓은 화면만). 단독 페이지는 CSS sticky, 임베드는 부모 뷰포트로 계산 */
  function placeStage() {
    var bp = $('.build-preview'), build = $('.build');
    if (!embedded || !viewport || !bp) return;
    var y = 0;
    if (window.innerWidth > 980) {
      var top = -viewport.iframeTop + nav.offsetHeight + 16 - (build.getBoundingClientRect().top + window.scrollY);
      y = Math.min(Math.max(0, top), Math.max(0, build.offsetHeight - bp.offsetHeight));
    }
    bp.style.transform = y ? 'translateY(' + y + 'px)' : '';
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
    sections.forEach(function (s) { if (s && !s.hidden && s.offsetTop <= probe) current = s.id; });
    $$('.nav-links a').forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('data-go') === current); });
  }
  window.addEventListener('scroll', markNav, { passive: true });

  /* ---------- 미리보기 갤러리 ---------- */
  var gallery = $('#gallery');
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  $$('.chat-card', gallery).forEach(function (card) {
    var c = (C.credits || {})[card.getAttribute('data-bg')];
    var cap = document.createElement(c && c.x ? 'a' : 'span');
    cap.className = 'credit';
    if (c) {
      if (c.x) { cap.href = c.x; cap.target = '_blank'; cap.rel = 'noopener'; cap.setAttribute('aria-label', c.name + ' 트위터(새 탭)'); }
      cap.innerHTML = (c.avatar ? '<img src="' + esc(c.avatar) + '" alt="" width="28" height="28">' : '') +
        '<b>' + esc(c.name) + '</b>' + (c.x ? '<i class="credit-x" aria-hidden="true">𝕏</i>' : '');
    }
    var fc = document.createElement('figcaption');
    fc.appendChild(cap);
    card.appendChild(fc);
  });
  function fitPreviews() {
    gallery.classList.toggle('is-scroll', gallery.scrollWidth > gallery.clientWidth + 1);
  }
  if ('ResizeObserver' in window) new ResizeObserver(fitPreviews).observe(gallery);
  window.addEventListener('resize', fitPreviews);
  fitPreviews();

  /* ---------- 구성·가격: 기본 구성 + 옵션, 미리보기 ---------- */
  var won = function (n) { return n.toLocaleString('ko-KR') + '원'; };
  var TBD = '가격 준비 중';
  var ASK = '별도 문의';
  var state = {};
  var tiers = {}; /* 금액 구간 옵션: 구간 시작 금액(원) 목록 */
  C.options.forEach(function (o) {
    state[o.id] = !!o.on;
    if (o.kind === 'tier') tiers[o.id] = (o.tiers || []).slice();
  });
  var man = function (n) { return n % 10000 ? won(n) : (n / 10000).toLocaleString('ko-KR') + '만 원'; };
  function tierCost(o) { return o.value == null ? null : o.value * tiers[o.id].length; }
  function tierRanges(o) {
    var t = tiers[o.id].slice().sort(function (a, b) { return a - b; });
    return t.map(function (v, i) { return man(v) + (t[i + 1] ? '~' + man(t[i + 1]) + ' 미만' : ' 이상'); });
  }

  $$('[data-revision]').forEach(function (el) { el.textContent = C.revision; });

  /* 기간 한정 할인: config의 promo.month가 한국 시간으로 이번 달일 때만 켠다 */
  var kstMonth = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 7);
  var promo = C.promo && C.promo.percent && (C.promo.month === kstMonth || /[?&]promo=1\b/.test(location.search)) ? C.promo : null;
  var promoPrice = function (n) { return Math.round(n * (100 - promo.percent) / 10000) * 100; };
  if (promo) {
    $$('[data-promo]').forEach(function (el) { el.textContent = promo[el.getAttribute('data-promo')] || ''; });
    $('#promoHero').hidden = false;
    $('#sumPromo').textContent = promo.tag + ' ' + promo.percent + '% 할인 적용';
    $('#sumPromo').hidden = false;
  }

  $('#baseName').textContent = C.base.name;
  $('#baseItems').innerHTML = C.base.items.concat(['수정 ' + C.revision + '회']).map(function (i) { return '<li>' + i + '</li>'; }).join('');
  $('#basePrice').innerHTML = (C.base.price == null ? TBD : promo ? '<s>' + won(C.base.price) + '</s> ' + won(promoPrice(C.base.price)) + ' <small class="base-promo">' + promo.tag + ' ' + promo.percent + '% 할인</small>' : won(C.base.price));

  /* 옵션 칸의 가격 표시. 고른 구성 목록에는 picked가 true로 와서 실제 더해지는 금액을 쓴다 */
  function optPrice(o, picked) {
    if (o.ask) return ASK;
    if (o.value == null) return TBD;
    if (o.kind === 'tier') return picked ? '+' + won(tierCost(o)) : '구간당 +' + won(o.value);
    return o.kind === 'percent' ? '+' + o.value + '%' : '+' + won(o.value);
  }

  var inputs = {};
  var groups = {};
  var pairs = {};
  C.options.forEach(function (o) {
    var g = document.createElement('div');
    g.className = 'opt-group';
    var l = document.createElement('label');
    if (o.pair) {
      /* 묶음 칸 안의 버튼: 누르면 켜지고 다시 누르면 꺼진다 */
      l.className = 'seg-opt';
      l.innerHTML = '<input type="checkbox" value="' + o.id + '"><b>' + (o.short || o.label) + '</b><em class="opt-price">' + optPrice(o) + '</em>';
    } else {
      l.className = 'opt';
      l.innerHTML = '<span class="opt-text"><b>' + o.label + '</b>' + (o.note ? '<small>' + o.note + '</small>' : '') + '</span>' +
        '<em class="opt-price">' + optPrice(o) + '</em><span class="switch"><input type="checkbox" role="switch" value="' + o.id + '"><span class="slider"></span></span>';
    }
    var input = l.querySelector('input');
    /* 라벨 안에 「?」 버튼(button)이 먼저 오므로 라벨이 스위치를 가리키게 못 박는다 */
    input.id = 'opt-' + o.id;
    l.htmlFor = input.id;
    input.checked = state[o.id];
    input.addEventListener('change', function () { setOpt(o.id, input.checked); });
    inputs[o.id] = input;
    g.appendChild(l);
    if (o.kind === 'tier') g.appendChild(tierEditor(o));
    groups[o.id] = g;
    if (o.parent && groups[o.parent]) {
      var kids = $('.opt-children', groups[o.parent]);
      if (!kids) {
        kids = document.createElement('div');
        kids.className = 'opt-children';
        groups[o.parent].appendChild(kids);
      }
      kids.appendChild(g);
    } else if (o.pair) {
      /* 같은 pair끼리 칸 하나에 묶는다 */
      if (!pairs[o.pair]) {
        pairs[o.pair] = document.createElement('div');
        pairs[o.pair].className = 'opt-pair';
        pairs[o.pair].innerHTML = '<b class="opt-pair-title">' + ((C.pairs || {})[o.pair] || '') + '</b><div class="seg"></div>';
        $(o.preview || o.design ? '#visualOpts' : '#extraOpts').appendChild(pairs[o.pair]);
      }
      $('.seg', pairs[o.pair]).appendChild(g);
    } else {
      $(o.preview || o.design ? '#visualOpts' : '#extraOpts').appendChild(g);
    }
  });

  /* 옵션 말풍선: 마우스를 올리거나 키보드로 고르면 옵션 위에 tip(설명·이미지·영상·HTML)을 띄운다.
     PC 말풍선은 이미지를 가로로 늘어놓는다. 마우스가 없는 기기(폰)는 옵션 칸의 「?」 버튼을 누르면 팝업으로 띄운다 */
  var tip = document.createElement('div');
  tip.className = 'opt-tip';
  tip.setAttribute('role', 'tooltip');
  tip.id = 'optTip';
  page.appendChild(tip);
  var tipFor = null, tipLabel = null;
  /* mp4(H.264)를 먼저 둔다: 아이폰은 webm을 고르면 못 풀어도 다음 source로 넘어가지 않는다 */
  function tipBody(t) {
    var media = '';
    [].concat(t.video || []).forEach(function (v) { media += '<video class="tip-media" width="900" height="738" autoplay muted loop playsinline poster="' + v + '.jpg"><source src="' + v + '.mp4" type="video/mp4"><source src="' + v + '.webm" type="video/webm"></video>'; });
    [].concat(t.img || []).forEach(function (src) { media += '<img class="tip-media" src="' + src + '" alt="">'; });
    var html = media ? '<div class="tip-row">' + media + '</div>' : '';
    if (t.html) html += t.html;
    if (t.text) html += '<p class="tip-text">' + t.text + '</p>';
    return html;
  }
  /* innerHTML로 넣은 영상은 폰에서 autoplay가 안 걸릴 때가 있어 직접 튼다 */
  function playTip(box) {
    [].forEach.call(box.querySelectorAll('video'), function (v) { v.muted = true; var r = v.play(); if (r && r.catch) r.catch(function () {}); });
  }
  function tipClass(base, t) {
    var n = [].concat(t.img || []).length + [].concat(t.video || []).length;
    return base + (t.cls ? ' ' + t.cls : '') + (n > 1 ? ' is-wide' : '');
  }
  function placeTip() {
    if (!tipLabel || !tip.classList.contains('is-on')) return;
    var l = tipLabel;
    var pr = page.getBoundingClientRect(), r = l.getBoundingClientRect();
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var x = Math.min(Math.max(8, r.left - pr.left + r.width / 2 - w / 2), page.clientWidth - w - 8);
    /* 화면 위쪽(고정 메뉴 아래)에 자리가 없으면 옵션 아래로 */
    var viewTop = embedded && viewport ? -viewport.iframeTop : 0;
    var below = r.top - h - 14 < viewTop + nav.offsetHeight + 16;
    tip.classList.toggle('is-below', below);
    tip.style.left = x + 'px';
    tip.style.top = (below ? r.bottom - pr.top + 12 : r.top - pr.top - h - 12) + 'px';
    tip.style.setProperty('--tail', (r.left - pr.left + r.width / 2 - x) + 'px');
  }
  function showTip(o, l) {
    if (tipFor !== o.id) { tip.innerHTML = tipBody(o.tip); tip.className = tipClass('opt-tip', o.tip); tipFor = o.id; }
    playTip(tip);
    tip.classList.add('is-on');
    l.setAttribute('aria-describedby', 'optTip');
    tipLabel = l;
    placeTip();
  }
  function hideTip() { tip.classList.remove('is-on'); tipLabel = null; }
  /* 이미지·영상이 늦게 떠서 말풍선 크기가 바뀌면 자리를 다시 잡는다 */
  if (window.ResizeObserver) new ResizeObserver(placeTip).observe(tip);
  else tip.addEventListener('load', placeTip, true);

  /* 폰 팝업 */
  var pop = document.createElement('div');
  pop.className = 'tip-pop';
  pop.hidden = true;
  pop.innerHTML = '<div class="tip-pop-card" role="dialog" aria-modal="true"><button type="button" class="tip-pop-close" aria-label="닫기">×</button><b class="tip-pop-title"></b><div class="tip-pop-body"></div></div>';
  page.appendChild(pop);
  var popCard = $('.tip-pop-card', pop), popBtn = null;
  function openPop(o, btn) {
    $('.tip-pop-title', pop).textContent = o.label;
    $('.tip-pop-body', pop).innerHTML = tipBody(o.tip);
    playTip(pop);
    popCard.className = tipClass('tip-pop-card', o.tip);
    pop.hidden = false;
    popBtn = btn;
    /* iframe은 내용 높이만큼 길어서 fixed가 화면 밖에 놓인다. 부모 화면 가운데에 맞춰 둔다 */
    if (embedded && viewport) {
      pop.classList.add('in-frame');
      var top = -viewport.iframeTop + Math.max(16, (viewport.viewportHeight - popCard.offsetHeight) / 2);
      popCard.style.top = Math.max(16, Math.min(top, page.offsetHeight - popCard.offsetHeight - 16)) + 'px';
    }
    $('.tip-pop-close', pop).focus();
  }
  function closePop() {
    if (pop.hidden) return;
    pop.hidden = true;
    $('.tip-pop-body', pop).innerHTML = '';
    if (popBtn) popBtn.focus();
  }
  pop.addEventListener('click', function (e) { if (e.target === pop || e.target.closest('.tip-pop-close')) closePop(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });

  var hoverable = window.matchMedia('(hover: hover) and (pointer: fine)');
  C.options.forEach(function (o) {
    if (!o.tip) return;
    var l = $('.opt', groups[o.id]);
    l.addEventListener('mouseenter', function () { if (hoverable.matches) showTip(o, l); });
    l.addEventListener('mouseleave', hideTip);
    inputs[o.id].addEventListener('focus', function () { if (inputs[o.id].matches(':focus-visible')) showTip(o, l); });
    inputs[o.id].addEventListener('blur', hideTip);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tip-btn';
    btn.textContent = '?';
    btn.setAttribute('aria-label', o.label + ' 미리보기');
    btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openPop(o, btn); });
    /* 제목 마지막 단어와 붙여 「?」만 다음 줄로 떨어지지 않게 */
    var title = $('.opt-text b', l), cut = o.label.lastIndexOf(' ') + 1, tail = document.createElement('span');
    tail.className = 'tip-nowrap';
    tail.textContent = o.label.slice(cut);
    tail.appendChild(btn);
    title.textContent = o.label.slice(0, cut);
    title.appendChild(tail);
  });

  /* 금액 구간 편집: 정해진 경계(bounds)마다 토글이 하나씩 있고, 켜면 그 금액에서 구간이 나뉜다.
     처음엔 나뉜 데가 없고(전부 기본 카드), 나눌 때마다 카드 하나 */
  function tierEditor(o) {
    var B = o.bounds;
    var box = document.createElement('div');
    box.className = 'tier-box';
    box.innerHTML = '<div class="tier-bar"></div><div class="tier-list"></div>';
    var bar = $('.tier-bar', box), list = $('.tier-list', box);
    var short = function (n) { return (n / 10000).toLocaleString('ko-KR') + '만'; };
    function draw() {
      var t = tiers[o.id].sort(function (a, b) { return a - b; });
      var edges = [0].concat(B);
      var html = '';
      edges.forEach(function (v, k) {
        var g = t.filter(function (c) { return c <= v; }).length; /* 이 칸이 속한 구간 번호(0은 기본 카드) */
        html += '<span class="tier-cell g' + (g % 4) + (k && t.indexOf(v) >= 0 ? ' is-cut' : '') + '">' + (k ? short(v) : '0') + (B[k] ? '~' + short(B[k]) : '~') + '</span>';
      });
      bar.innerHTML = html;
      var rows = '<p class="tier-row is-base"><span>0원~' + (t[0] ? man(t[0]) + ' 미만' : '') + '</span><em>기본 카드</em></p>';
      B.forEach(function (v) {
        var on = t.indexOf(v) >= 0, g = t.filter(function (c) { return c <= v; }).length;
        rows += '<label class="tier-row tier-toggle' + (on ? ' is-on' : '') + '"><span>' + (on ? '<i class="tier-dot g' + (g % 4) + '"></i>' : '') + man(v) + '부터 따로</span>' +
          '<em>' + (on ? '+' + won(o.value || 0) : '') + '</em>' +
          '<span class="switch"><input type="checkbox" role="switch" data-v="' + v + '"' + (on ? ' checked' : '') + ' aria-label="' + man(v) + '부터 구간 나누기"><span class="slider"></span></span></label>';
      });
      list.innerHTML = rows;
    }
    list.addEventListener('change', function (e) {
      var v = +e.target.getAttribute('data-v'), t = tiers[o.id];
      if (!v) return;
      if (e.target.checked) { if (t.indexOf(v) < 0) t.push(v); } else t.splice(t.indexOf(v), 1);
      draw(); render();
      $('input[data-v="' + v + '"]', list).focus();
    });
    draw();
    return box;
  }

  function setOpt(id, on) {
    state[id] = on;
    var me = C.options.filter(function (o) { return o.id === id; })[0];
    C.options.forEach(function (o) {
      if (on && me.pair && o.pair === me.pair && o.id !== id) state[o.id] = false;
      if (on && o.id === id && o.parent) state[o.parent] = true;
      if (!on && o.parent === id) state[o.id] = false;
    });
    C.options.forEach(function (o) {
      inputs[o.id].checked = state[o.id];
      groups[o.id].classList.toggle('is-on', state[o.id]);
    });
    var visual = C.options.some(function (o) { return o.preview && (o.id === id || o.parent === id); });
    if (visual) sendPreview();
    shakeStage();
    render();
  }
  function shakeStage() {
    var st = $('#stage'), pop = $('#pop');
    st.classList.remove('is-shake');
    pop.classList.remove('is-pop', 'is-left');
    if (Math.random() < .5) pop.classList.add('is-left'); /* 왼쪽 위·오른쪽 위 중 아무 데나 */
    void st.offsetWidth; /* 연달아 눌러도 처음부터 다시 흔들리게 */
    st.classList.add('is-shake');
    pop.classList.add('is-pop');
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
  frame.src = 'assets/live/miruru.html?v=8&' + Object.keys(p0).map(function (k) { return k + '=' + (p0[k] ? 1 : 0); }).join('&');
  frame.addEventListener('load', sendPreview);
  if ('ResizeObserver' in window) new ResizeObserver(fitStage).observe(stage);
  window.addEventListener('resize', fitStage);
  fitStage();

  var picked = null;
  function pickRows(opts) {
    var rows = [{ base: true, label: C.base.name, sub: C.base.items.concat(['수정 ' + C.revision + '회']).join(' · '), price: C.base.price == null ? TBD : won(C.base.price) }];
    return rows.concat(opts.map(function (o) {
      return { label: o.label, sub: o.kind === 'tier' ? tierRanges(o).join(' · ') || '아직 구간을 나누지 않았어요' : '', price: optPrice(o, true) };
    }));
  }

  function render() {
    var opts = chosenOpts();
    $('#delayField').hidden = !state.delay;
    var total = C.base.price;
    var pct = 0;
    opts.forEach(function (o) {
      if (o.ask) return;
      if (total == null || o.value == null) { total = null; return; }
      if (o.kind === 'percent') pct += o.value; else total += o.kind === 'tier' ? tierCost(o) : o.value;
    });
    if (total != null) total += Math.round(total * pct / 100);
    var full = total;
    if (promo && total != null) total = promoPrice(total);
    var asked = opts.some(function (o) { return o.ask; });
    $('#sumPrice').innerHTML = total == null ? TBD : won(total) + (asked ? '<small> + ' + ASK + '</small>' : '');
    $('#sumWas').textContent = full == null ? '' : won(full);
    $('#sumWas').hidden = !promo || full == null;

    var rush = opts.filter(function (o) { return o.deadline; })[0];

    var totalText = total == null ? TBD : won(total) + (asked ? ' + ' + ASK : '');
    var daysText = rush ? rush.deadline : '';
    var rows = pickRows(opts);
    if (promo) rows.push({ promo: true, label: promo.title, price: full == null ? '-' + promo.percent + '%' : '-' + won(full - total) });
    $('#pickList').innerHTML = rows.map(function (r) {
      return '<li' + (r.base ? ' class="is-base"' : r.promo ? ' class="is-promo"' : '') + '><span><b>' + r.label + '</b>' + (r.sub ? '<small>' + r.sub + '</small>' : '') + '</span><em>' + r.price + '</em></li>';
    }).join('');
    $('#pickPrice').textContent = '예상 ' + totalText;
    $('#pickDays').textContent = daysText;
    picked = { rows: rows, total: totalText, days: daysText };
    sendHeight(false);
  }

  C.options.forEach(function (o) { groups[o.id].classList.toggle('is-on', state[o.id]); });
  render();

  /* ---------- 슬롯: 구글 시트 「공개」 탭 CSV ---------- */
  function parseCsv(text) {
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') q = false;
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  function monthLabel(ym) {
    var m = /^(\d{4})-(\d{1,2})/.exec(ym);
    if (!m) return ym;
    return (+m[1] !== new Date().getFullYear() ? '<small>' + m[1] + '년</small>' : '') + (+m[2]) + '월';
  }

  function slotState(r) {
    var total = Math.max(0, parseInt(r[1], 10) || 0);
    var booked = Math.min(total, Math.max(0, parseInt(r[2], 10) || 0));
    var st = (r[3] || '').trim();
    var kind = st === '오픈 예정' ? 'soon' : st === '휴식' ? 'off' : (st === '마감' || booked >= total) ? 'full' : 'open';
    /* 시트가 「2026-11」을 날짜로 바꿔 「2026. 11. 1」처럼 내보내도 읽는다 */
    var ym = /(\d{4})\D+(\d{1,2})/.exec(r[0] || '');
    var month = ym ? ym[1] + '-' + ('0' + ym[2]).slice(-2) : '';
    return { month: month, label: monthLabel(month), total: total, booked: booked, left: total - booked, kind: kind, note: (r[4] || '').trim() };
  }

  var SLOT_PILL = { open: function (s) { return s.left + '자리 남음'; }, full: function () { return '마감'; }, soon: function () { return '오픈 예정'; }, off: function () { return '쉬어요'; } };

  /* 시트를 읽어 열린 달이 없을 때만 true. 못 읽으면 막지 않는다. */
  var noSlot = false;

  function renderSlots(rows) {
    var now = new Date();
    var cur = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
    var list = rows.map(slotState).filter(function (s) { return /^\d{4}-\d{2}/.test(s.month) && s.month.slice(0, 7) >= cur; }).slice(0, C.slots.months || 3);
    if (!list.length) return;
    $('#slotList').innerHTML = list.map(function (s) {
      var dots = '';
      for (var i = 0; i < s.total; i++) dots += '<i class="' + (i < s.booked ? 'is-booked' : '') + '"></i>';
      var sale = promo && s.month === promo.month && (s.kind === 'open' || s.kind === 'soon');
      return '<article class="slot is-' + s.kind + (sale ? ' is-sale' : '') + '">' +
        (sale ? '<span class="slot-sale">' + promo.tag + ' ' + promo.percent + '% 할인</span>' : '') +
        '<div class="slot-top"><h3>' + s.label + '</h3><span class="slot-pill">' + SLOT_PILL[s.kind](s) + '</span></div>' +
        (s.kind === 'off' ? '' : '<div class="slot-dots" aria-label="전체 ' + s.total + '자리 중 ' + s.booked + '자리 예약">' + dots + '</div>') +
        '<p class="slot-sub">' + (s.note || (s.kind === 'open' ? s.total + '자리 중 ' + s.booked + '자리 예약' : s.kind === 'off' ? '이달은 작업을 쉬어요' : '')) + '</p>' +
        '</article>';
    }).join('');
    $('#slot').hidden = false;
    $$('[data-slot-link]').forEach(function (a) { a.hidden = false; });
    sections = $$('.nav-links a').map(function (a) { return document.getElementById(a.getAttribute('data-go')); });
    var first = list.filter(function (s) { return s.kind === 'open'; })[0];
    var badge = $('#slotBadge');
    badge.textContent = first ? first.label.replace(/<\/?small>/g, '').replace('년', '년 ') + ' 슬롯 ' + first.left + '자리 남음' + (promo && first.month === promo.month ? ' · ' + promo.tag + ' ' + promo.percent + '% 할인 중' : '') : '이번 슬롯은 마감됐어요';
    badge.classList.toggle('is-full', !first);
    /* 열린 달이 없으면 견적·신청 양식에 안내를 띄우고 양식 복사를 막는다 */
    noSlot = !first;
    $$('[data-noslot]').forEach(function (el) { el.hidden = !noSlot; });
    $('#copyBtn').disabled = noSlot;
    badge.hidden = false;
    sendHeight(true);
  }

  if (C.slots) {
    if (C.slots.csvUrl) {
      fetch(C.slots.csvUrl, { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (t) { renderSlots(parseCsv(t).slice(1)); })
        .catch(function () { /* 시트를 못 읽으면 슬롯 칸을 숨긴 채로 둔다 */ });
    } else if (/[?&]slots=demo\b/.test(location.search)) {
      renderSlots(C.slots.demo);
    }
  }

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
      '방송 플랫폼: ' + v('platform'),
      '',
      '[고른 구성]',
    ];
    picked.rows.forEach(function (r) { lines.push('- ' + r.label + (r.sub ? ' (' + r.sub + ')' : '') + ' ' + r.price); });
    lines.push('예상 견적: ' + picked.total + (picked.days ? ' · ' + picked.days : ''), '');
    lines.push(
      '원하는 분위기: ' + v('mood'),
      '메인 색: ' + v('color'),
      '캐릭터: ' + v('assets'),
      '참고 자료: ' + v('refs')
    );
    if (state.delay) lines.splice(lines.length - 1, 0, '공개 희망일: ' + v('delayDate'));
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
    if (noSlot) return;
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
