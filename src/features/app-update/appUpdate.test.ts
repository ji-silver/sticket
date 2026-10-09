import { parseAppUpdatePolicy, requiresAppUpdate } from './appUpdate';

const row = {
  platform: 'ios',
  enabled: true,
  minimum_version: '1.6.0',
  message: '스티켓을 계속 이용하려면 최신 버전으로 업데이트해 주세요.',
};

describe('필수 업데이트 버전 판단', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['1.5.0', '1.6.0', true],
    ['1.6.0', '1.6.0', false],
    ['1.7.0', '1.6.0', false],
    ['1.9.0', '1.10.0', true],
    ['1.10.0', '1.9.0', false],
    ['2.0.0', '1.99.99', false],
  ])(
    '설치 버전 %s와 최소 버전 %s를 숫자로 비교한다',
    (version, minimum, required) => {
      const policy = parseAppUpdatePolicy({ ...row, minimum_version: minimum });
      expect(requiresAppUpdate(version, policy)).toBe(required);
    },
  );

  it('개발자가 필수 업데이트를 끄면 이전 버전도 이용할 수 있다', () => {
    expect(
      requiresAppUpdate(
        '1.0.0',
        parseAppUpdatePolicy({ ...row, enabled: false }),
      ),
    ).toBe(false);
    expect(requiresAppUpdate('1.0.0', null)).toBe(false);
  });

  it.each(['1.bad.0', '1.6', '1.6.0-beta', '-1.0.0', '9007199254740992.0.0'])(
    '잘못된 정책 버전 %s를 거부한다',
    minimum => {
      expect(() =>
        parseAppUpdatePolicy({ ...row, minimum_version: minimum }),
      ).toThrow();
    },
  );

  it.each([
    null,
    { ...row, platform: 'web' },
    { ...row, enabled: 'true' },
    { ...row, message: '   ' },
  ])('잘못된 정책은 적용하지 않는다', value => {
    expect(() => parseAppUpdatePolicy(value)).toThrow();
  });

  it('설치 버전을 읽지 못했을 때 잘못된 비교로 차단하지 않는다', () => {
    expect(requiresAppUpdate('unknown', parseAppUpdatePolicy(row))).toBe(false);
  });
});
