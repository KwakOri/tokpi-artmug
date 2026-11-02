/*
 * 가격·기간·옵션은 여기만 고치면 페이지 전체(가격표·견적·신청 양식)에 반영된다.
 * price가 null이면 「가격 준비 중」으로 보이고, 견적 계산은 가격이 다 정해져야 금액을 보여 준다.
 * 아트머그 상품 정보 칸(가격·작업 기간)과 숫자를 맞출 것.
 */
window.TOKPI_CONFIG = {
  revision: 1,
  showOmakase: false,
  tiers: [
    {
      id: 'light',
      name: '라이트',
      summary: '채팅 한 가지만 깔끔하게',
      items: ['채팅 1종', '시안 1개'],
      price: null,
      omakase: null,
      days: 7,
    },
    {
      id: 'standard',
      name: '스탠다드',
      summary: '채팅에 구독·후원 카드까지 한 디자인으로',
      items: ['채팅 1종', '구독·후원 카드', '시안 1개'],
      price: null,
      omakase: null,
      days: 7,
      badge: '추천',
    },
    {
      id: 'pro',
      name: '프로',
      summary: '시청자·구독자·스트리머 채팅을 각각 다르게',
      items: ['시청자·구독자·스트리머 채팅', '구독·후원 카드', '시안 1개'],
      price: null,
      omakase: null,
      days: 10,
    },
  ],
  /* kind: 'won'은 금액을 더하고, 'percent'는 단계 가격에 비율을 더한다. */
  options: [
    { id: 'rush', label: '빠른 마감', note: '제작 기간 절반', kind: 'percent', value: null },
    { id: 'private', label: '포트폴리오 비공개', note: '완성작을 공개하지 않아요', kind: 'won', value: null },
  ],
};
