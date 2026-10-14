import React from 'react';
import { Alert } from 'react-native';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from '../../../test-utils.tsx';
import { updateTicketMemo } from '../../../features/ticket/ticket.service.ts';
import TicketReviewSection from './TicketReviewSection.tsx';

jest.mock('../../../features/ticket/ticket.service.ts', () => ({
  updateTicketMemo: jest.fn(),
  updateTicketRating: jest.fn(),
  updateTicketFoods: jest.fn(),
}));

const saveMemo = jest.mocked(updateTicketMemo);

async function setup(memo: string | null = null) {
  await render(
    <TicketReviewSection
      ticketId="ticket-1"
      initialRating={null}
      initialMemo={memo}
      initialFoods={[]}
    />,
  );
}

async function reportMemoLines(texts: string[]) {
  await fireEvent(
    screen.getByTestId('record-line-measure', { includeHiddenElements: true }),
    'textLayout',
    {
      nativeEvent: {
        lines: texts.map((text, index) => ({
          text,
          x: 0,
          y: index * 24,
          width: 120,
          height: 24,
          ascender: 16,
          descender: 4,
          capHeight: 12,
          xHeight: 8,
        })),
      },
    },
  );
}

describe('경기 기록 메모 편집', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveMemo.mockReset().mockResolvedValue(null);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it('긴 메모를 편집하지 않고 끝까지 펼쳐 읽은 뒤 다시 3줄로 접을 수 있다', async () => {
    const user = userEvent.setup();
    const lines = [
      '응원석에서 봤다',
      '초반에는 어려웠다',
      '마지막 회 역전',
      '끝까지 남긴 기록',
    ];
    const memo = lines.join('\n');
    await setup(memo);
    await reportMemoLines(lines);

    await user.press(
      screen.getByRole('button', { name: '오늘의 기록 전체 보기' }),
    );
    expect(screen.getByText(memo).props.numberOfLines).toBeUndefined();
    expect(screen.queryByLabelText('오늘의 기록 입력')).toBeNull();
    expect(saveMemo).not.toHaveBeenCalled();

    await user.press(screen.getByRole('button', { name: '오늘의 기록 접기' }));
    expect(screen.getByText(memo).props.numberOfLines).toBe(3);
    expect(
      screen.getByRole('button', { name: '오늘의 기록 전체 보기' }),
    ).toBeVisible();
  });

  it('화면에서 3줄 안에 들어오는 메모에는 전체 보기 버튼을 표시하지 않는다', async () => {
    await setup('짧은 기록');
    await reportMemoLines(['짧은 기록']);

    expect(screen.getByText('짧은 기록')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: '오늘의 기록 전체 보기' }),
    ).toBeNull();
  });

  it('3줄을 넘는 메모도 입력한 내용 전체를 저장한다', async () => {
    const user = userEvent.setup();
    const memo =
      '첫 번째 경기\n응원석에서 봤다\n마지막 회 역전\n다음에도 오고 싶다';
    saveMemo.mockResolvedValueOnce(memo);
    await setup();
    expect(screen.getByText('오늘의 기록')).toBeVisible();

    await user.press(
      screen.getByRole('button', { name: '오늘의 기록 작성하기' }),
    );
    await user.type(screen.getByLabelText('오늘의 기록 입력'), memo);

    expect(screen.getByLabelText('오늘의 기록 입력')).toHaveDisplayValue(memo);
    await user.press(screen.getByRole('button', { name: '오늘의 기록 저장' }));

    await waitFor(() => {
      expect(screen.queryByLabelText('오늘의 기록 입력')).toBeNull();
      expect(screen.getByText(memo)).toBeVisible();
    });
    expect(saveMemo).toHaveBeenCalledWith('ticket-1', memo);
  });

  it('수정을 취소하면 기존 메모를 유지하고 다시 편집해도 취소한 내용은 남지 않는다', async () => {
    const user = userEvent.setup();
    await setup('처음 남긴 기록');
    await user.press(screen.getByRole('button', { name: '오늘의 기록 수정' }));
    await user.clear(screen.getByLabelText('오늘의 기록 입력'));
    await user.type(
      screen.getByLabelText('오늘의 기록 입력'),
      '저장하지 않을 내용',
    );
    await user.press(screen.getByRole('button', { name: '편집 취소' }));

    expect(screen.getByText('처음 남긴 기록')).toBeVisible();
    expect(saveMemo).not.toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: '오늘의 기록 수정' }));
    expect(screen.getByLabelText('오늘의 기록 입력')).toHaveDisplayValue(
      '처음 남긴 기록',
    );
  });

  it('기존 메모를 모두 지워 저장하면 미작성 상태로 돌아가고 빈 내용으로 다시 작성할 수 있다', async () => {
    const user = userEvent.setup();
    await setup('지울 기록');
    await user.press(screen.getByRole('button', { name: '오늘의 기록 수정' }));
    await user.clear(screen.getByLabelText('오늘의 기록 입력'));
    await user.press(screen.getByRole('button', { name: '오늘의 기록 저장' }));

    await waitFor(() => {
      expect(screen.queryByLabelText('오늘의 기록 입력')).toBeNull();
      expect(screen.getByText('아직 기록이 없어요')).toBeVisible();
    });
    expect(saveMemo).toHaveBeenCalledWith('ticket-1', '');
    await user.press(
      screen.getByRole('button', { name: '오늘의 기록 작성하기' }),
    );
    expect(screen.getByLabelText('오늘의 기록 입력')).toHaveDisplayValue('');
  });

  it('저장 중에는 입력과 취소 및 추가 저장을 막고 서버가 정리한 메모를 표시한다', async () => {
    const user = userEvent.setup();
    let finishSave!: (memo: string | null) => void;
    saveMemo.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finishSave = resolve;
        }),
    );
    await setup();
    await user.press(
      screen.getByRole('button', { name: '오늘의 기록 작성하기' }),
    );
    await user.type(
      screen.getByLabelText('오늘의 기록 입력'),
      '  저장할 메모  ',
    );
    await user.press(screen.getByRole('button', { name: '오늘의 기록 저장' }));

    const savingButton = await screen.findByRole('button', {
      name: '오늘의 기록 저장',
      busy: true,
    });
    const cancelButton = screen.getByRole('button', {
      name: '편집 취소',
    });
    expect(savingButton).toBeDisabled();
    expect(screen.queryByText('저장')).toBeNull();
    expect(screen.queryByText(/저장\s*중/)).toBeNull();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByLabelText('오늘의 기록 입력')).toBeDisabled();
    await user.press(savingButton);
    await user.press(cancelButton);
    expect(saveMemo).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('오늘의 기록 입력')).toHaveDisplayValue(
      '  저장할 메모  ',
    );

    await act(async () => {
      finishSave('저장할 메모');
    });
    await waitFor(() => {
      expect(screen.queryByLabelText('오늘의 기록 입력')).toBeNull();
      expect(screen.getByText('저장할 메모')).toBeVisible();
    });
  });

  it('저장 실패 후에도 작성한 내용을 유지하고 다시 저장할 수 있다', async () => {
    const user = userEvent.setup();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    saveMemo
      .mockRejectedValueOnce(new Error('네트워크 오류'))
      .mockResolvedValueOnce('다시 저장할 메모');
    await setup('원래 기록');
    await user.press(screen.getByRole('button', { name: '오늘의 기록 수정' }));
    await user.clear(screen.getByLabelText('오늘의 기록 입력'));
    await user.type(
      screen.getByLabelText('오늘의 기록 입력'),
      '다시 저장할 메모',
    );
    await user.press(screen.getByRole('button', { name: '오늘의 기록 저장' }));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '기록을 저장하지 못했어요',
        '잠시 후 다시 시도해 주세요.',
      );
    });
    expect(screen.getByLabelText('오늘의 기록 입력')).toHaveDisplayValue(
      '다시 저장할 메모',
    );
    await user.press(screen.getByRole('button', { name: '오늘의 기록 저장' }));
    await waitFor(() => {
      expect(screen.queryByLabelText('오늘의 기록 입력')).toBeNull();
      expect(screen.getByText('다시 저장할 메모')).toBeVisible();
    });
  });
});
