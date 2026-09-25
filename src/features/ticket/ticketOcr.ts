import type { KboGame } from '../game/types.ts';
import {
  findStadiumIdsInText,
  type StadiumId,
} from './seatCatalog.ts';

export interface ParsedTicketOcr {
  date: string | null;
  stadiumId: StadiumId | null;
  text: string;
}

export interface ParsedTicketSeat {
  seatName: string;
  seatDetail: string;
}

const DATE_PATTERN =
  /(?<!\d)(\d{2}|\d{4})\s*(?:[.\-/]|년)\s*(\d{1,2})\s*(?:[.\-/]|월)\s*(\d{1,2})\s*일?(?!\d)/gu;
const DETAIL_PATTERN =
  /[A-Za-z0-9]+\s*(?:블럭|블록)|[A-Za-z가-힣0-9]+\s*열|\d+\s*번/gu;

const normalizeSeatName = (value: string) =>
  value.toLowerCase().replace(/\s+/gu, '');

function parseDateCandidates(text: string, today: string) {
  const dates = new Set<string>();

  for (const match of text.matchAll(DATE_PATTERN)) {
    const yearText = match[1];
    const year = yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      continue;
    }

    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(
      day,
    ).padStart(2, '0')}`;

    if (dateString <= today) {
      dates.add(dateString);
    }
  }

  return [...dates];
}

export function parseTicketOcrText(
  text: string,
  today: string,
): ParsedTicketOcr {
  const dates = parseDateCandidates(text, today);
  const stadiumIds = findStadiumIdsInText(text);

  return {
    date: dates.length === 1 ? dates[0] : null,
    stadiumId: stadiumIds.length === 1 ? stadiumIds[0] : null,
    text,
  };
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

const hasExactTeamName = (text: string, teamName: string) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}])${escapeRegExp(teamName).replace(
      /\\s+/gu,
      '\\s*',
    )}(?![\\p{L}\\p{N}])`,
    'iu',
  ).test(text);

export function findUniqueGameByTicketText(
  games: KboGame[],
  text: string,
  stadiumId: StadiumId | null,
) {
  if (stadiumId) {
    const stadiumGames = games.filter(
      game => findStadiumIdsInText(game.stadiumName)[0] === stadiumId,
    );
    if (stadiumGames.length === 1) {
      return stadiumGames[0];
    }
  }

  const matchedTeamIds = new Set(
    games.flatMap(game =>
      [
        [game.awayTeamId, game.awayTeamName],
        [game.homeTeamId, game.homeTeamName],
      ]
        .filter(([, teamName]) => hasExactTeamName(text, teamName))
        .map(([teamId]) => teamId),
    ),
  );

  if (matchedTeamIds.size === 0) {
    return null;
  }

  const matches = games.filter(game =>
    [...matchedTeamIds].every(
      teamId => teamId === game.awayTeamId || teamId === game.homeTeamId,
    ),
  );

  return matches.length === 1 ? matches[0] : null;
}

export function parseTicketSeatDetail(text: string): string | null {
  const detailMatches = Array.from(text.matchAll(DETAIL_PATTERN), match => ({
    index: match.index,
    text: match[0].trim(),
  }));
  const detailGroups = [
    detailMatches.filter(match => /(?:블럭|블록)$/u.test(match.text)),
    detailMatches.filter(match => /열$/u.test(match.text)),
    detailMatches.filter(match => /번$/u.test(match.text)),
  ];

  if (
    detailGroups.some(
      matches =>
        new Set(matches.map(match => normalizeSeatName(match.text))).size > 1,
    )
  ) {
    return null;
  }

  return detailMatches
    .filter(
      (match, index, matches) =>
        matches.findIndex(
          candidate =>
            normalizeSeatName(candidate.text) === normalizeSeatName(match.text),
        ) === index,
    )
    .sort((first, second) => first.index - second.index)
    .map(match => match.text)
    .join(' ');
}

export function matchTicketSeat(
  text: string,
  seatNames: readonly string[],
): ParsedTicketSeat | null {
  const normalizedText = normalizeSeatName(text);
  const matchedNames = seatNames.filter(seatName =>
    normalizedText.includes(normalizeSeatName(seatName)),
  );
  const specificNames = matchedNames.filter(seatName => {
    const normalizedName = normalizeSeatName(seatName);

    return !matchedNames.some(
      otherName =>
        otherName !== seatName &&
        normalizeSeatName(otherName).includes(normalizedName),
    );
  });

  if (specificNames.length !== 1) {
    return null;
  }

  const seatDetail = parseTicketSeatDetail(text);
  if (seatDetail === null) {
    return null;
  }

  return { seatName: specificNames[0], seatDetail };
}
