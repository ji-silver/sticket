import { Share, type View } from 'react-native';
import type { RefObject } from 'react';
import {
  captureRef,
  releaseCapture,
} from 'react-native-view-shot';
import type { Ticket } from '../../../../features/ticket/types.ts';

export type DiaryExportMode = 'withGameInfo' | 'diaryOnly';

export interface DiaryExportGameInfo {
  detail: string;
  matchup: string;
}

export function getDiaryExportGameInfo(
  ticket: Ticket,
): DiaryExportGameInfo {
  const detail = [
    formatMatchDate(ticket.matchDate),
    ticket.matchTime,
    ticket.stadiumName,
  ].join(' ');

  if (ticket.isCancelled || ticket.gameStatus === 'CANCELLED') {
    return {
      detail,
      matchup: `${ticket.awayTeamName} · 경기 취소 · ${ticket.homeTeamName}`,
    };
  }

  if (ticket.gameStatus === 'FINISHED') {
    const score =
      ticket.awayScore !== null && ticket.homeScore !== null
        ? `${ticket.awayScore} : ${ticket.homeScore}`
        : '경기 종료';

    return {
      detail,
      matchup: `${ticket.awayTeamName}  ${score}  ${ticket.homeTeamName}`,
    };
  }

  if (ticket.gameStatus === 'IN_PROGRESS') {
    return {
      detail,
      matchup: `${ticket.awayTeamName} · 경기 진행 중 · ${ticket.homeTeamName}`,
    };
  }

  return {
    detail,
    matchup: `${ticket.awayTeamName}  vs  ${ticket.homeTeamName}`,
  };
}

export async function exportDiaryImage({
  mode,
  paperRef,
  compositionRef,
  prepareComposition,
}: {
  mode: DiaryExportMode;
  paperRef: RefObject<View | null>;
  compositionRef: RefObject<View | null>;
  prepareComposition: (paperUri: string) => Promise<void>;
}) {
  const capturedUris: string[] = [];

  try {
    const paperUri = await captureRef(paperRef, {
      format: 'png',
      result: 'tmpfile',
    });
    capturedUris.push(paperUri);

    let sharedUri = paperUri;

    if (mode === 'withGameInfo') {
      await prepareComposition(toFileUrl(paperUri));
      sharedUri = await captureRef(compositionRef, {
        format: 'png',
        result: 'tmpfile',
      });
      capturedUris.push(sharedUri);
    }

    await Share.share({ url: toFileUrl(sharedUri) });
  } finally {
    capturedUris.forEach(uri => releaseCapture(uri));
  }
}

function formatMatchDate(dateString: string) {
  const [year, month, day] = dateString.split('-');

  return `${year}. ${month}. ${day}.`;
}

function toFileUrl(uri: string) {
  return uri.startsWith('file://') ? uri : `file://${uri}`;
}
