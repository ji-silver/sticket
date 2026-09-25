import { recognizeTicketText } from './ticketOcr.service.ts';

const mockRecognizeText = jest.fn();

jest.mock('../../../specs/NativeTicketTextRecognizer', () => ({
  recognizeText: (...args: unknown[]) => mockRecognizeText(...args),
}));

describe('티켓 OCR 네이티브 연결', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('크롭 이미지 URI를 네이티브 OCR에 전달한다', async () => {
    mockRecognizeText.mockResolvedValue('2026.08.01\n잠실야구장');

    await expect(recognizeTicketText('/tmp/ticket.jpg')).resolves.toBe(
      '2026.08.01\n잠실야구장',
    );
    expect(mockRecognizeText).toHaveBeenCalledWith('/tmp/ticket.jpg');
  });
});
