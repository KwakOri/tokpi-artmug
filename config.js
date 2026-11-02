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
    days: 7,
  },
  /*
   * preview: 켜고 끌 때 미리보기(assets/live/miruru.html)에 넘기는 값.
   * design: true면 미리보기 값이 없어도 위쪽 「디자인 옵션」에 놓인다. preview도 design도 없으면 「그 밖의 옵션」.
   * kind: 'won'은 금액을 더하고, 'percent'는 나머지 합계에 비율을 더한다.
   * days: 작업 기간에 더할 날 수. half: true면 작업 기간을 절반으로.
   * needs: 이 옵션을 켜면 함께 켜지는 옵션.
   */
  options: [
    { id: 'cards', label: '구독·후원 카드', note: '테마 카드로 알림', preview: 'cards', on: true, kind: 'won', value: 30000, days: 0 },
    { id: 'roles', label: '역할별 채팅', note: '스트리머·구독자 따로', preview: 'roles', on: true, kind: 'won', value: 30000, days: 3 },
    { id: 'fx', label: '화려한 연출', note: '구독·후원 카드 등장 효과', preview: 'fx', needs: 'cards', kind: 'won', value: 20000, days: 2 },
    { id: 'tiers', label: '금액별 후원 카드', note: '1만·10만·100만 원 이상', design: true, needs: 'cards', kind: 'won', value: 30000, days: 2 },
    { id: 'random', label: '랜덤 디자인', note: '2~3가지 중 무작위', design: true, kind: 'won', value: 20000, days: 2 },
    { id: 'rush', label: '빠른 마감', note: '작업 기간 절반', kind: 'percent', value: 50, half: true },
    { id: 'private', label: '포트폴리오 비공개', note: '완성작 비공개', kind: 'won', value: 20000 },
  ],
  /*
   * credits: 미리보기 갤러리 카드(index.html data-bg) 아래에 붙는 버튜버 정보.
   * name만 있으면 이름만, x(트위터 주소)가 있으면 누르면 새 탭으로 열린다. avatar는 assets/ 아래 정사각형 이미지(없으면 생략).
   * 항목이 없는 카드는 빈 줄로 높이만 맞춘다.
   */
  credits: {
    witch: null,
    ghost: null,
    miruru: { name: '미루루', x: null, avatar: null },
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
