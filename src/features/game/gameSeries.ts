export function getKboSeriesLabel(seriesType?: string): string | null {
  // 정규시즌은 기본 대진으로 표시한다. 기존 POSTSEASON 값에는 단계가 없으므로
  // 재수집 전까지 날짜나 팀 조합으로 세부 단계 이름을 추측하지 않는다.
  switch (seriesType) {
    case 'WILDCARD': return '와일드카드';
    case 'SEMI_PLAYOFF': return '준플레이오프';
    case 'PLAYOFF': return '플레이오프';
    case 'KOREAN_SERIES': return '한국시리즈';
    case 'PRESEASON': return '시범경기';
    default: return null;
  }
}
