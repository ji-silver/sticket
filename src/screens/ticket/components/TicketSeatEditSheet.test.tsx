import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '../../../test-utils';
import { useUpdateTicketSeat } from '../../../features/ticket/api/useUpdateTicketSeat.ts';
import {
  DOOSAN_SEAT_NAMES,
  INCHEON_SEAT_NAMES,
} from '../../../features/ticket/seatCatalog.ts';
import TicketSeatEditSheet from './TicketSeatEditSheet.tsx';

jest.mock('../../../features/ticket/api/useUpdateTicketSeat.ts', () => ({
  useUpdateTicketSeat: jest.fn(),
}));

afterEach(cleanup);

describe('TicketSeatEditSheet', () => {
  const incheonSeatName = INCHEON_SEAT_NAMES[0];
  const mutateAsync = jest.fn();
  const onSaved = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mutateAsync.mockResolvedValue({
      seatName: incheonSeatName,
      seatDetail: '9블록 J열 12번',
    });
    (useUpdateTicketSeat as jest.Mock).mockReturnValue({
      mutateAsync,
      isPending: false,
    });
  });

  it('인천구장 좌석명을 선택하고 상세 위치를 저장한다', async () => {
    await render(
      <TicketSeatEditSheet
        visible
        ticketId="ticket-1"
        stadiumName="문학"
        homeTeamName="SSG"
        seatName={null}
        seatDetail={null}
        onSaved={onSaved}
        onClose={onClose}
      />,
    );

    expect(screen.getByPlaceholderText('좌석명 직접 입력')).toBeVisible();
    expect(
      screen.getByPlaceholderText('블록 열 좌석 번호 입력'),
    ).toBeVisible();
    expect(screen.queryByText('좌석명')).not.toBeOnTheScreen();
    expect(screen.queryByText('상세 위치')).not.toBeOnTheScreen();

    await fireEvent.changeText(
      screen.getByLabelText('좌석명'),
      '현장 안내 좌석',
    );

    await fireEvent.press(
      screen.getByRole('button', { name: '좌석명 목록 열기' }),
    );
    expect(screen.queryByText('직접 입력')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByText(incheonSeatName));
    await fireEvent.changeText(
      screen.getByLabelText('상세 위치'),
      '9블록 J열 12번',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: '좌석 정보 저장' }),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        ticketId: 'ticket-1',
        seatName: incheonSeatName,
        seatDetail: '9블록 J열 12번',
      });
      expect(onSaved).toHaveBeenCalledWith({
        seatName: incheonSeatName,
        seatDetail: '9블록 J열 12번',
      });
    });
  });

  it('좌석 목록이 없는 구장에서는 좌석명 선택 버튼 없이 직접 입력만 제공한다', async () => {
    await render(
      <TicketSeatEditSheet
        visible
        ticketId="ticket-1"
        stadiumName="울산"
        homeTeamName="롯데"
        seatName="1루 응원지정석"
        seatDetail="23블록"
        onSaved={onSaved}
        onClose={onClose}
      />,
    );

    expect(screen.getByLabelText('좌석명').props.value).toBe(
      '1루 응원지정석',
    );
    expect(screen.getByLabelText('상세 위치').props.value).toBe('23블록');
    expect(
      screen.queryByRole('button', { name: '좌석명 목록 열기' }),
    ).toBeNull();
  });

  it('잠실 두산 홈경기에서는 두산 좌석명을 선택한다', async () => {
    await render(
      <TicketSeatEditSheet
        visible
        ticketId="ticket-1"
        stadiumName="잠실"
        homeTeamName="두산"
        seatName={null}
        seatDetail={null}
        onSaved={onSaved}
        onClose={onClose}
      />,
    );

    await fireEvent.press(
      screen.getByRole('button', { name: '좌석명 목록 열기' }),
    );

    const selectedSeatName = DOOSAN_SEAT_NAMES[0];
    await fireEvent.press(screen.getByText(selectedSeatName));
    expect(screen.getByLabelText('좌석명').props.value).toBe(selectedSeatName);
  });
});
