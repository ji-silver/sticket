import {
  DOOSAN_SEAT_NAMES,
  formatTicketSeat,
  GOCHEOK_SEAT_NAMES,
  getSeatNamesForGame,
  HANWHA_SEAT_NAMES,
  INCHEON_SEAT_NAMES,
  KIA_SEAT_NAMES,
  KT_WIZ_SEAT_NAMES,
  LG_SEAT_NAMES,
  LOTTE_SEAT_NAMES,
  NC_SEAT_NAMES,
  SAMSUNG_SEAT_NAMES,
} from './seatCatalog.ts';

describe('getSeatNamesForGame', () => {
  it.each([
    '문학',
    '인천',
    'SSG랜더스필드',
    '인천 SSG랜더스필드',
    '인천 SSG 랜더스필드',
  ])('%s 경기장에는 인천구장 좌석 목록을 제공한다', stadiumName => {
    expect(getSeatNamesForGame(stadiumName)).toBe(INCHEON_SEAT_NAMES);
  });

  it.each(['수원', 'KT위즈파크', '수원 KT위즈파크'])(
    '%s 경기장에는 KT 구장 좌석 목록을 제공한다',
    stadiumName => {
      expect(getSeatNamesForGame(stadiumName)).toBe(KT_WIZ_SEAT_NAMES);
    },
  );

  it.each(['고척', '고척돔', '고척 스카이돔'])(
    '%s 경기장에는 고척 좌석 목록을 제공한다',
    stadiumName => {
      expect(getSeatNamesForGame(stadiumName)).toBe(GOCHEOK_SEAT_NAMES);
    },
  );

  it.each(['대전', '한화생명 볼파크', '대전 한화생명 볼파크'])(
    '%s 경기장에는 한화 좌석 목록을 제공한다',
    stadiumName => {
      expect(getSeatNamesForGame(stadiumName)).toBe(HANWHA_SEAT_NAMES);
    },
  );

  it.each([
    '광주',
    '기아챔피언스필드',
    '광주 KIA챔피언스필드',
    '광주-기아 챔피언스 필드',
  ])(
    '%s 경기장에는 KIA 좌석 목록을 제공한다',
    stadiumName => {
      expect(getSeatNamesForGame(stadiumName)).toBe(KIA_SEAT_NAMES);
    },
  );

  it.each(['창원', 'NC파크', '창원 NC파크'])(
    '%s 경기장에는 NC 좌석 목록을 제공한다',
    stadiumName => {
      expect(getSeatNamesForGame(stadiumName)).toBe(NC_SEAT_NAMES);
    },
  );

  it.each(['대구', '삼성라이온즈파크', '대구 삼성라이온즈파크'])(
    '%s 경기장에는 삼성 좌석 목록을 제공한다',
    stadiumName => {
      expect(getSeatNamesForGame(stadiumName)).toBe(SAMSUNG_SEAT_NAMES);
    },
  );

  it.each(['사직', '사직야구장', '부산 사직야구장'])(
    '%s 경기장에는 롯데 좌석 목록을 제공한다',
    stadiumName => {
      expect(getSeatNamesForGame(stadiumName)).toBe(LOTTE_SEAT_NAMES);
    },
  );

  it.each(['잠실', '잠실야구장', '서울 잠실야구장'])(
    '%s 경기의 홈팀이 두산이면 두산 좌석 목록을 제공한다',
    stadiumName => {
      expect(getSeatNamesForGame(stadiumName, '두산')).toBe(
        DOOSAN_SEAT_NAMES,
      );
    },
  );

  it.each(['잠실', '잠실야구장', '서울 잠실야구장'])(
    '%s 경기의 홈팀이 LG이면 LG 좌석 목록을 제공한다',
    stadiumName => {
      expect(getSeatNamesForGame(stadiumName, 'LG')).toBe(LG_SEAT_NAMES);
    },
  );

  it('좌석 목록에는 빈 이름과 중복 이름이 없다', () => {
    const catalogs = [
      INCHEON_SEAT_NAMES,
      KT_WIZ_SEAT_NAMES,
      GOCHEOK_SEAT_NAMES,
      HANWHA_SEAT_NAMES,
      KIA_SEAT_NAMES,
      NC_SEAT_NAMES,
      SAMSUNG_SEAT_NAMES,
      LOTTE_SEAT_NAMES,
      DOOSAN_SEAT_NAMES,
      LG_SEAT_NAMES,
    ];

    catalogs.forEach(seatNames => {
      expect(seatNames.length).toBeGreaterThan(0);
      expect(new Set(seatNames).size).toBe(seatNames.length);
      expect(
        seatNames.every(
          seatName => seatName.length > 0 && seatName.trim() === seatName,
        ),
      ).toBe(true);
    });
  });

  it('잠실 경기의 홈팀을 모르면 좌석 목록을 제공하지 않는다', () => {
    expect(getSeatNamesForGame('잠실')).toEqual([]);
  });

  it.each(['울산', '', undefined])(
    '%s 경기장에는 좌석 목록을 제공하지 않는다',
    stadiumName => {
      expect(getSeatNamesForGame(stadiumName)).toEqual([]);
    },
  );
});

describe('formatTicketSeat', () => {
  it('좌석명과 상세 위치가 모두 있으면 공백으로 연결한다', () => {
    expect(formatTicketSeat('덕아웃 상단석', '9블록 J열 12번')).toBe(
      '덕아웃 상단석 9블록 J열 12번',
    );
  });

  it('상세 위치가 없으면 좌석명만 반환한다', () => {
    expect(formatTicketSeat('몰리스 그린존', null)).toBe('몰리스 그린존');
  });
});
