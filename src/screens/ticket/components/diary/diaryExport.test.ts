import { Share } from 'react-native';
import {
  captureRef,
  releaseCapture,
} from 'react-native-view-shot';
import type { Ticket } from '../../../../features/ticket/types.ts';
import {
  exportDiaryImage,
  getDiaryExportGameInfo,
} from './diaryExport.ts';

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(),
  releaseCapture: jest.fn(),
}));

const shareSpy = jest.spyOn(Share, 'share');

const createTicket = (patch: Partial<Ticket> = {}): Ticket => ({
  id: 'ticket-1',
  pageOrientation: 'portrait',
  matchDate: '2026-08-30',
  matchTime: '18:30',
  stadiumName: '잠실',
  seatName: null,
  rating: null,
  memo: null,
  foods: [],
  homeTeamName: '두산',
  awayTeamName: 'LG',
  homeScore: 3,
  awayScore: 5,
  gameStatus: 'FINISHED',
  isCancelled: false,
  awayLineup: [],
  homeLineup: [],
  ...patch,
});

describe('다이어리 경기 정보', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('종료된 경기는 날짜와 최종 점수를 표시한다', () => {
    expect(getDiaryExportGameInfo(createTicket())).toEqual({
      detail: '2026. 08. 30. 18:30 잠실',
      matchup: 'LG  5 : 3  두산',
    });
  });

  it('취소된 경기는 점수 대신 경기 취소 상태를 표시한다', () => {
    expect(
      getDiaryExportGameInfo(
        createTicket({
          gameStatus: 'CANCELLED',
          isCancelled: true,
          awayScore: null,
          homeScore: null,
        }),
      ).matchup,
    ).toBe('LG · 경기 취소 · 두산');
  });

  it('진행 중인 경기는 변경될 수 있는 점수 대신 상태를 표시한다', () => {
    expect(
      getDiaryExportGameInfo(
        createTicket({ gameStatus: 'IN_PROGRESS' }),
      ).matchup,
    ).toBe('LG · 경기 진행 중 · 두산');
  });

  it('예정된 경기는 점수 없이 대진만 표시한다', () => {
    expect(
      getDiaryExportGameInfo(
        createTicket({
          gameStatus: 'SCHEDULED',
          awayScore: null,
          homeScore: null,
        }),
      ).matchup,
    ).toBe('LG  vs  두산');
  });
});

describe('다이어리 이미지 내보내기', () => {
  const paperRef = { current: {} } as any;
  const compositionRef = { current: {} } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    shareSpy.mockResolvedValue({ action: Share.sharedAction });
  });

  it('다이어리만 선택하면 속지 이미지를 바로 iOS 공유 시트로 전달한다', async () => {
    (captureRef as jest.Mock).mockResolvedValue('/tmp/diary.png');
    const prepareComposition = jest.fn();

    await exportDiaryImage({
      mode: 'diaryOnly',
      paperRef,
      compositionRef,
      prepareComposition,
    });

    expect(captureRef).toHaveBeenCalledTimes(1);
    expect(prepareComposition).not.toHaveBeenCalled();
    expect(Share.share).toHaveBeenCalledWith({
      url: 'file:///tmp/diary.png',
    });
    expect(releaseCapture).toHaveBeenCalledWith('/tmp/diary.png');
  });

  it('경기 정보를 포함하면 속지와 경기 정보를 합성한 이미지를 전달한다', async () => {
    (captureRef as jest.Mock)
      .mockResolvedValueOnce('/tmp/diary.png')
      .mockResolvedValueOnce('/tmp/diary-with-game.png');
    const prepareComposition = jest.fn().mockResolvedValue(undefined);

    await exportDiaryImage({
      mode: 'withGameInfo',
      paperRef,
      compositionRef,
      prepareComposition,
    });

    expect(prepareComposition).toHaveBeenCalledWith(
      'file:///tmp/diary.png',
    );
    expect(captureRef).toHaveBeenCalledTimes(2);
    expect(Share.share).toHaveBeenCalledWith({
      url: 'file:///tmp/diary-with-game.png',
    });
    expect(releaseCapture).toHaveBeenCalledWith('/tmp/diary.png');
    expect(releaseCapture).toHaveBeenCalledWith(
      '/tmp/diary-with-game.png',
    );
  });

  it('공유 시트를 열지 못해도 임시 이미지를 정리한다', async () => {
    (captureRef as jest.Mock).mockResolvedValue('/tmp/diary.png');
    shareSpy.mockRejectedValueOnce(new Error('share failed'));

    await expect(
      exportDiaryImage({
        mode: 'diaryOnly',
        paperRef,
        compositionRef,
        prepareComposition: jest.fn(),
      }),
    ).rejects.toThrow('share failed');

    expect(releaseCapture).toHaveBeenCalledWith('/tmp/diary.png');
  });
});
