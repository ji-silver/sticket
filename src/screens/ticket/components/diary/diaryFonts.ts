import type { TicketDiaryFontId } from '../../../../features/ticket/types.ts';
import { fonts } from '../../../../styles/fonts.ts';

export interface DiaryFontOption {
  id: TicketDiaryFontId;
  label: string;
  regularFamily: string;
  boldFamily: string | null;
}

export const DEFAULT_DIARY_FONT_ID: TicketDiaryFontId = 'pretendard';

export const DIARY_FONT_OPTIONS: readonly DiaryFontOption[] = [
  {
    id: 'pretendard',
    label: 'Pretendard',
    regularFamily: fonts.regular,
    boldFamily: fonts.bold,
  },
  {
    id: 'corncorn',
    label: '온글잎 콘콘체',
    regularFamily: 'Ownglyph corncorn',
    boldFamily: null,
  },
  {
    id: 'yuntaeng',
    label: '온글잎 윤탱체',
    regularFamily: 'Ownglyph yuntaeng',
    boldFamily: null,
  },
  {
    id: 'bookkMyungjo',
    label: '부크크 명조',
    regularFamily: 'BookkMyungjo-Lt',
    boldFamily: 'BookkMyungjo-Bd',
  },
  {
    id: 'kyobo2025',
    label: '교보손글씨 2025',
    regularFamily: 'Kyobo Handwriting 2025',
    boldFamily: null,
  },
];

export function getDiaryFontOption(fontId: unknown): DiaryFontOption {
  return (
    DIARY_FONT_OPTIONS.find(option => option.id === fontId) ??
    DIARY_FONT_OPTIONS[0]
  );
}

export function getDiaryFontFamily(
  fontId: TicketDiaryFontId,
  isBold: boolean,
): string {
  const option = getDiaryFontOption(fontId);

  if (isBold && option.boldFamily !== null) {
    return option.boldFamily;
  }

  return option.regularFamily;
}
