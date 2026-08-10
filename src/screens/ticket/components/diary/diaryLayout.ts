export const DIARY_BOTTOM_TOOLBAR_HEIGHT = 72;
export const REFERENCE_DIARY_PAGE_WIDTH = 393;
export const REFERENCE_DIARY_PAGE_HEIGHT = 587;

const MAX_DIARY_PAGE_WIDTH = 640;
const DIARY_PAGE_HORIZONTAL_INSET = 32;
const PHONE_LAYOUT_MAX_DIMENSION = 500;

interface Size {
  width: number;
  height: number;
}

export function getDiaryPageLayout(
  containerSize: Size,
  availableHeight: number,
) {
  const shortestDimension = Math.min(containerSize.width, containerSize.height);
  const longestDimension = Math.max(containerSize.width, containerSize.height);
  const isPhoneLayout =
    shortestDimension > 0 &&
    shortestDimension <= PHONE_LAYOUT_MAX_DIMENSION &&
    longestDimension <= 1000;
  const horizontalInset = isPhoneLayout ? 0 : DIARY_PAGE_HORIZONTAL_INSET;
  const pageWidth = Math.min(
    Math.max(0, containerSize.width - horizontalInset),
    MAX_DIARY_PAGE_WIDTH,
    Math.max(0, availableHeight) *
      (REFERENCE_DIARY_PAGE_WIDTH / REFERENCE_DIARY_PAGE_HEIGHT),
  );

  return { isPhoneLayout, pageWidth };
}
