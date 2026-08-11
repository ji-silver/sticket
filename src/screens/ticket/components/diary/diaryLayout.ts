import type { TicketDiaryOrientation } from '../../../../features/ticket/types.ts';

export const DIARY_BOTTOM_TOOLBAR_HEIGHT = 72;
export const REFERENCE_DIARY_PAGE_WIDTH = 393;
export const REFERENCE_DIARY_PAGE_HEIGHT = 587;
export const REFERENCE_DIARY_EDITOR_HEIGHT = 524;

const MAX_DIARY_PAGE_WIDTH = 640;
const DIARY_PAGE_HORIZONTAL_INSET = 32;
const PHONE_LAYOUT_MAX_DIMENSION = 500;

const PORTRAIT_PAPER_SPACING = { grid: 20, line: 28 } as const;
const LANDSCAPE_PAPER_SPACING = { grid: 14, line: 20 } as const;
const PORTRAIT_PREVIEW_SPACING = { grid: 8, line: 9 } as const;
const LANDSCAPE_PREVIEW_SPACING = { grid: 6, line: 7 } as const;

interface Size {
  width: number;
  height: number;
}

const PORTRAIT_PAGE_SIZE: Size = {
  width: REFERENCE_DIARY_PAGE_WIDTH,
  height: REFERENCE_DIARY_PAGE_HEIGHT,
};

const LANDSCAPE_PAGE_SIZE: Size = {
  width: REFERENCE_DIARY_PAGE_HEIGHT,
  height: REFERENCE_DIARY_PAGE_WIDTH,
};

export function getDiaryPageSize(
  orientation: TicketDiaryOrientation,
): Size {
  return orientation === 'landscape'
    ? LANDSCAPE_PAGE_SIZE
    : PORTRAIT_PAGE_SIZE;
}

export function getDiaryEditorSize(
  orientation: TicketDiaryOrientation,
): Size {
  return orientation === 'landscape'
    ? LANDSCAPE_PAGE_SIZE
    : {
        width: REFERENCE_DIARY_PAGE_WIDTH,
        height: REFERENCE_DIARY_EDITOR_HEIGHT,
      };
}

export function getDiaryPaperSpacing(pageSize: Size, isPreview = false) {
  const isLandscape = pageSize.width > pageSize.height;

  if (isPreview) {
    return isLandscape
      ? LANDSCAPE_PREVIEW_SPACING
      : PORTRAIT_PREVIEW_SPACING;
  }

  return isLandscape ? LANDSCAPE_PAPER_SPACING : PORTRAIT_PAPER_SPACING;
}

export function getDiaryPageLayout(
  containerSize: Size,
  availableHeight: number,
  pageSize: Size = PORTRAIT_PAGE_SIZE,
) {
  const shortestDimension = Math.min(containerSize.width, containerSize.height);
  const longestDimension = Math.max(containerSize.width, containerSize.height);
  const isPhoneLayout =
    shortestDimension > 0 &&
    shortestDimension <= PHONE_LAYOUT_MAX_DIMENSION &&
    longestDimension <= 1000;
  const horizontalInset = isPhoneLayout ? 0 : DIARY_PAGE_HORIZONTAL_INSET;
  const maximumPageWidth =
    pageSize.width > pageSize.height
      ? Number.POSITIVE_INFINITY
      : MAX_DIARY_PAGE_WIDTH;
  const pageWidth = Math.min(
    Math.max(0, containerSize.width - horizontalInset),
    maximumPageWidth,
    Math.max(0, availableHeight) *
      (pageSize.width / pageSize.height),
  );

  return { isPhoneLayout, pageWidth };
}
