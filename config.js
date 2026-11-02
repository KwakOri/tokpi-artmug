/*
 * 가격·기간·옵션은 여기만 고치면 페이지 전체(구성·가격, 신청 양식)에 반영된다.
 * price·value가 null이면 「가격 준비 중」으로 보이고, 견적은 고른 것의 가격이 다 정해져야 금액을 보여 준다.
 * 아트머그 상품 정보 칸(가격·작업 기간)과 숫자를 맞출 것.
 */
window.TOKPI_CONFIG = {
  revision: 2,
  base: {
    name: '기본 구성',
    items: ['시청자 채팅 1종', '시안 제공'],
    price: null,
    days: 7,
  },
  /*
   * preview: 켜고 끌 때 미리보기(assets/live/miruru.html)에 넘기는 값. 없으면 「그 밖의 옵션」에 놓인다.
   * kind: 'won'은 금액을 더하고, 'percent'는 나머지 합계에 비율을 더한다.
   * days: 작업 기간에 더할 날 수. half: true면 작업 기간을 절반으로.
   * needs: 이 옵션을 켜면 함께 켜지는 옵션.
   */
  options: [
    { id: 'cards', label: '구독·후원 카드', note: '구독·후원이 오면 테마 카드로 떠요', preview: 'cards', on: true, kind: 'won', value: null, days: 0 },
    { id: 'roles', label: '스트리머·구독자 채팅 따로', note: '역할마다 이름표와 말풍선이 달라요', preview: 'roles', on: true, kind: 'won', value: null, days: 3 },
    { id: 'fx', label: '구독·후원 화려한 연출', note: '쾅 떨어지고 반짝이며 등장해요', preview: 'fx', needs: 'cards', kind: 'won', value: null, days: 2 },
    { id: 'rush', label: '빠른 마감', note: '작업 기간 절반', kind: 'percent', value: null, half: true },
    { id: 'private', label: '포트폴리오 비공개', note: '완성작을 공개하지 않아요', kind: 'won', value: null },
  ],
};
