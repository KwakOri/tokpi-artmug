/*
 * 가격·기간·옵션은 여기만 고치면 페이지 전체(구성·가격, 신청 양식)에 반영된다.
 * price·value가 null이면 「가격 준비 중」으로 보이고, 견적은 고른 것의 가격이 다 정해져야 금액을 보여 준다.
 * 아트머그 상품 정보 칸(가격·작업 기간)과 숫자를 맞출 것.
 * 2026-11-02 가격은 임시값(주인 요청으로 임의 입력). 확정되면 고칠 것.
 */
window.TOKPI_CONFIG = {
  revision: 2,
  base: {
    name: '기본 구성',
    items: ['시청자 채팅 1종', '시안 제공'],
    price: 50000,
  },
  /*
   * preview: 켜고 끌 때 미리보기(assets/live/miruru.html)에 넘기는 값.
   * design: true면 미리보기 값이 없어도 위쪽 「디자인 옵션」에 놓인다. preview도 design도 없으면 「그 밖의 옵션」.
   * kind: 'won'은 금액을 더하고, 'percent'는 나머지 합계에 비율을 더한다.
   *   'tier'는 금액 구간 옵션: tiers(구간 시작 금액, 원)마다 value를 더한다. 0원~첫 구간 미만은 기본 카드라 값에 안 들어간다. 처음엔 비워 둔다(나뉜 데 없음).
   *   bounds: 플랫폼에서 고를 수 있는 구간 경계(원). 경계마다 토글이 하나씩 생기고, 켜면 그 금액에서 나뉜다(경계 3개 → 바 네 칸).
   * deadline: 켜면 고른 구성 아래에 보여 줄 마감 문구. 작업 기간은 슬롯에 따라 정해져서 따로 적지 않는다.
   * parent: 이 옵션이 들어가는 상위 옵션. 상위 옵션 아래에 들여 써서 보이고, 켜면 상위 옵션도 켜지고, 상위를 끄면 같이 꺼진다.
   * pair: 같은 값끼리 칸 하나(제목은 아래 pairs)에 묶여 버튼처럼 나란히 놓이고, 하나만 고를 수 있다. short: 그 안에 보일 짧은 이름.
   * ask: true면 가격 칸에 「별도 문의」로 보이고, 견적 합계에는 넣지 않고 「+ 별도 문의」만 붙인다.
   * tip: 옵션에 마우스를 올리면 위쪽 말풍선에(폰은 「?」 버튼 팝업에) 띄울 미리보기. 없으면 말풍선을 안 띄운다.
   *   text: 한 줄 설명 · cls: 말풍선에 붙일 class(tip-chat은 폰 팝업에서 채팅 이미지를 좌우로 엇갈려 작게). 이미지가 둘 이상이면 PC 말풍선은 넓어지고 가로로 늘어놓는다 · img: 이미지 주소(여러 장이면 배열) · video: 확장자 뺀 주소(.webm·.mp4·.jpg를 같이 둔다) · html: 직접 그린 HTML
   *   이미지·영상은 assets/tips/ 아래. 지금 것은 assets/live/miruru.html 화면에서 잘라 냈다.
   */
  options: [
    { id: 'cards', label: '구독·후원 카드', preview: 'cards', kind: 'won', value: 30000, tip: { text: '구독·후원이 오면 이런 카드가 떠요', img: ['assets/tips/sub.webp?v=4', 'assets/tips/don.webp?v=4'] } },
    { id: 'tiers', label: '금액별 후원 카드', preview: 'tiers', parent: 'cards', ask: true, tip: { text: '플랫폼마다 금액 구분 기준이 달라 별도 문의로 받아요', html: '<div class="tip-tiers"><span class="g0"><b>기본 카드</b>0원~</span><span class="g1"><b>카드 2</b>1만 원~</span><span class="g2"><b>카드 3</b>10만 원~</span></div>' } },
    { id: 'roles', label: '스트리머·구독자 채팅 따로', preview: 'roles', kind: 'won', value: 30000, tip: { cls: 'tip-chat', text: '시청자·스트리머·구독자마다 이름표와 말풍선이 달라요', img: ['assets/tips/viewer.webp?v=3', 'assets/tips/streamer.webp?v=3', 'assets/tips/subchat.webp?v=3'] } },
    { id: 'random', label: '랜덤 요소 추가', preview: 'random', ask: true, tip: { text: '같은 채팅도 올 때마다 조금씩 달라요', html: '<div class="tip-random"><p><b>장식 랜덤</b><span>★</span><span>♥</span><span>✦</span><small>장식 하나당 +1만 원</small></p><p><b>카드 통째로 랜덤·이스터에그</b><span class="wide">가끔 전혀 다른 깜짝 카드가 떠요</span><small>+2~3만 원 선</small></p></div>' } },
    /* 플랫폼 추가: 기본 구성은 플랫폼 1개(위플랩 치지직 등). 1개당 +1만 원, 둘 중 하나만 */
    { id: 'platform1', label: '플랫폼 1개 추가', short: '1개 추가', pair: 'platform', kind: 'won', value: 10000 },
    { id: 'platform2', label: '플랫폼 2개 추가', short: '2개 추가', pair: 'platform', kind: 'won', value: 20000 },
    /* 빠른 마감은 세 단계 중 하나만 */
    { id: 'rush3', label: '빠른 마감 3일 이내', short: '3일 이내', pair: 'rush', kind: 'percent', value: 200, deadline: '결제일 기준 3일 안에 완성' },
    { id: 'rush7', label: '빠른 마감 7일 이내', short: '7일 이내', pair: 'rush', kind: 'percent', value: 100, deadline: '결제일 기준 7일 안에 완성' },
    { id: 'rush14', label: '빠른 마감 2주 이내', short: '2주 이내', pair: 'rush', kind: 'percent', value: 50, deadline: '결제일 기준 2주 안에 완성' },
    { id: 'private', label: '포트폴리오 비공개', short: '비공개', pair: 'portfolio', kind: 'won', value: 30000 },
    /* 공개 미루기를 켜면 신청 양식에 「공개 희망일」 칸이 나온다 */
    { id: 'delay', label: '포트폴리오 공개 미루기', short: '공개 미루기', pair: 'portfolio', kind: 'won', value: 10000 },
  ],
  /* pair로 묶인 칸의 제목 */
  pairs: { platform: '플랫폼 추가', rush: '빠른 마감', portfolio: '포트폴리오' },
  /*
   * promo: 기간 한정 할인. month(한국 시간 기준 그달)에만 켜진다. 지나면 저절로 사라지니 지울 필요는 없다.
   * percent만큼 예상 견적 합계(빠른 마감 포함)를 깎고, 첫 화면 띠·기본 구성·견적·신청 양식·그달 슬롯에 할인 표시를 붙인다.
   * null이면 할인 표시를 모두 끈다. ?promo=1을 붙이면 기간과 상관없이 켜서 볼 수 있다.
   */
  promo: {
    month: '2026-11',
    percent: 20,
    tag: '샘플가',
    title: '11월 한정 샘플가 20% 할인',
    note: '신규 입점 기념 샘플 모집 중이에요! 11월에 신청하면 모든 구성을 샘플가로 20% 할인해 드려요.',
  },
  /*
   * credits: 미리보기 갤러리 카드(index.html data-bg) 아래에 붙는 버튜버 정보.
   * name만 있으면 이름만, x(트위터 주소)가 있으면 누르면 새 탭으로 열린다. avatar는 assets/ 아래 정사각형 이미지(없으면 생략).
   * 항목이 없는 카드는 빈 줄로 높이만 맞춘다.
   */
  credits: {
    witch: { name: '할로윈 이벤트', x: null, avatar: null },
    ghost: { name: '할로윈 이벤트', x: null, avatar: null },
    miruru: { name: '시로우미 미루루', x: null, avatar: null },
  },
  /*
   * 슬롯: 구글 시트 「공개」 탭을 웹에 CSV로 게시한 주소(파일 > 공유 > 웹에 게시 > 공개 탭 · CSV).
   * 칸: 월(2026-11) | 전체 | 예약 | 상태(열림·마감·오픈 예정·휴식) | 안내. 틀은 sheets/slots-public.csv.
   * csvUrl이 null이면 슬롯 칸을 숨긴다. 주소 뒤에 ?slots=demo를 붙이면 demo 값으로 미리 본다.
   */
  slots: {
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRfOQZAUdLV_YBIPJfDo_mSihbFFUB9Y6ku3_BXrHWapuYBOV1KFnE-m7u4C6RfoCQcHszPV9UZftb/pub?gid=853614306&single=true&output=csv',
    months: 3,
    demo: [
      ['2026-11', 5, 5, '열림', ''],
      ['2026-12', 5, 2, '열림', ''],
      ['2027-01', 5, 0, '오픈 예정', '12월 15일 오픈'],
    ],
  },
};
