import type { KboGame } from '../game/types.ts';
import {
  findUniqueGameByTicketText,
  matchTicketSeat,
  parseTicketSeatDetail,
  parseTicketOcrText,
} from './ticketOcr.ts';

const makeGame = (
  id: string,
  stadiumName: string,
  time = '18:30',
): KboGame => ({
  id,
  date: '2026-08-01',
  time,
  season: 2026,
  seriesType: 'REGULAR',
  stadiumName,
  awayTeamId: 'kia',
  homeTeamId: 'ssg',
  awayTeamName: 'KIA',
  homeTeamName: 'SSG',
  awayScore: null,
  homeScore: null,
});

describe('티켓 OCR 날짜와 구장 판별', () => {
  it('유효한 날짜와 하나의 구장만 있으면 자동 입력 후보를 만든다', () => {
    expect(
      parseTicketOcrText(
        '2026.08.01\n잠실야구장\n오렌지석 112블럭 A열 8번',
        '2026-08-03',
      ),
    ).toEqual({
      date: '2026-08-01',
      stadiumId: 'jamsil',
      text: '2026.08.01\n잠실야구장\n오렌지석 112블럭 A열 8번',
    });
  });

  it('같은 날짜가 반복돼도 하나의 날짜로 판단한다', () => {
    expect(
      parseTicketOcrText(
        '경기일 2026.08.01\n2026년 8월 1일',
        '2026-08-03',
      ).date,
    ).toBe('2026-08-01');
  });

  it('서로 다른 날짜가 둘 이상이면 날짜를 적용하지 않는다', () => {
    expect(
      parseTicketOcrText(
        '예매일 2026.07.20\n경기일 2026.08.01',
        '2026-08-03',
      ).date,
    ).toBeNull();
  });

  it.each(['2026.02.30', '2026.08.04'])(
    '유효하지 않거나 미래인 날짜 %s는 적용하지 않는다',
    text => {
      expect(parseTicketOcrText(text, '2026-08-03').date).toBeNull();
    },
  );

  it('두 자리 연도가 있는 날짜를 2000년대로 해석한다', () => {
    expect(
      parseTicketOcrText('26년 8월 1일', '2026-08-03').date,
    ).toBe('2026-08-01');
  });

  it('서로 다른 구장이 둘 이상이면 구장을 적용하지 않는다', () => {
    expect(
      parseTicketOcrText('잠실야구장\n고척스카이돔', '2026-08-03')
        .stadiumId,
    ).toBeNull();
  });
});

describe('티켓 OCR 경기 판별', () => {
  it('구장이 일치하는 경기가 하나면 해당 경기를 반환한다', () => {
    const game = makeGame('incheon-game', '인천 SSG랜더스필드');

    expect(findUniqueGameByTicketText([game], '', 'incheon')).toBe(game);
  });

  it('같은 구장의 경기가 둘이면 경기를 자동 선택하지 않는다', () => {
    const games = [
      makeGame('double-header-1', '인천 SSG랜더스필드', '14:00'),
      makeGame('double-header-2', '인천 SSG랜더스필드', '18:30'),
    ];

    expect(findUniqueGameByTicketText(games, '', 'incheon')).toBeNull();
  });

  it('구장명이 없으면 정확히 인식한 팀들이 포함된 유일한 경기를 반환한다', () => {
    const lgSsgGame = {
      ...makeGame('lg-ssg', '잠실'),
      awayTeamId: 'ssg',
      homeTeamId: 'lg',
      awayTeamName: 'SSG',
      homeTeamName: 'LG',
    };
    const kiaSsgGame = makeGame('kia-ssg', '인천 SSG랜더스필드');

    expect(
      findUniqueGameByTicketText(
        [lgSsgGame, kiaSsgGame],
        'LG TWINS vs ssG',
        null,
      ),
    ).toBe(lgSsgGame);
  });

  it('같은 팀의 경기 후보가 둘이면 팀명만으로 자동 선택하지 않는다', () => {
    const games = [
      makeGame('double-header-1', '인천 SSG랜더스필드', '14:00'),
      makeGame('double-header-2', '인천 SSG랜더스필드', '18:30'),
    ];

    expect(findUniqueGameByTicketText(games, 'SSG', null)).toBeNull();
  });
});

describe('티켓 OCR 좌석 판별', () => {
  it('경기 정보가 없어도 하나뿐인 상세 위치를 반환한다', () => {
    expect(parseTicketSeatDetail('116블록 10열 117번')).toBe(
      '116블록 10열 117번',
    );
  });

  it('영문이 섞인 블록 표기를 원문 그대로 반환한다', () => {
    expect(
      matchTicketSeat('1루 으쓱이존\n2B블럭 G열 8번', ['으쓱이존']),
    ).toEqual({
      seatName: '으쓱이존',
      seatDetail: '2B블럭 G열 8번',
    });
  });

  it('가장 구체적인 좌석명 하나와 원문 상세 위치를 반환한다', () => {
    expect(
      matchTicketSeat('중앙 테이블석 112블럭 A열 8번', [
        '테이블석',
        '중앙 테이블석',
      ]),
    ).toEqual({
      seatName: '중앙 테이블석',
      seatDetail: '112블럭 A열 8번',
    });
  });

  it('좌석명만 확실하면 상세 위치 없이 좌석명을 반환한다', () => {
    expect(matchTicketSeat('오렌지석', ['블루석', '오렌지석'])).toEqual({
      seatName: '오렌지석',
      seatDetail: '',
    });
  });

  it('독립적인 좌석명이 둘이면 좌석을 적용하지 않는다', () => {
    expect(
      matchTicketSeat('테이블석 또는 외야석', ['테이블석', '외야석']),
    ).toBeNull();
  });

  it('상세 위치 후보가 여러 세트면 좌석을 적용하지 않는다', () => {
    expect(
      matchTicketSeat(
        '테이블석 112블록 A열 8번\n201블록 B열 9번',
        ['테이블석'],
      ),
    ).toBeNull();
  });

  it('기존 좌석명과 정확히 일치하지 않으면 좌석을 적용하지 않는다', () => {
    expect(matchTicketSeat('오렌지 지정석', ['오렌지석'])).toBeNull();
  });
});
