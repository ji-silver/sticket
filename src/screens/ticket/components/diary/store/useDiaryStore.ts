import { create } from 'zustand';
import type { DiaryItem, SelectedDiaryItem } from '../TicketDiaryPage.tsx';
import type { PaperType } from '../DiaryPaperSelector.tsx';
import type { DiaryToolId } from '../DiaryBottomToolbar.tsx';

import { DIARY_STICKER_PACKS } from '../diaryStickerPacks.ts';

type SetterArg<T> = T | ((prev: T) => T);

interface InitializeDiaryPayload {
  items: DiaryItem[];
  drawingIndex: number;
  paperType: PaperType;
}

interface DiaryState {
  items: DiaryItem[];
  selectedItem: SelectedDiaryItem;
  drawingIndex: number;
  paperType: PaperType;
  selectedTool: DiaryToolId | null;
  isLayerPanelVisible: boolean;
  selectedStickerPackId: string;
  editingTextId: string | null;
  setItems: (arg: SetterArg<DiaryItem[]>) => void;
  setSelectedItem: (arg: SetterArg<SelectedDiaryItem>) => void;
  setDrawingIndex: (arg: SetterArg<number>) => void;
  setPaperType: (type: PaperType) => void;
  setSelectedTool: (tool: DiaryToolId | null) => void;
  setIsLayerPanelVisible: (arg: SetterArg<boolean>) => void;
  setSelectedStickerPackId: (id: string) => void;
  setEditingTextId: (arg: SetterArg<string | null>) => void;
  initializeDiary: (payload: InitializeDiaryPayload) => void;
  reset: () => void;
}

function resolve<T>(arg: SetterArg<T>, prev: T): T {
  return typeof arg === 'function' ? (arg as (prev: T) => T)(prev) : arg;
}

const createInitialState = () => ({
  items: [] as DiaryItem[],
  selectedItem: null as SelectedDiaryItem,
  drawingIndex: 0,
  paperType: 'plain' as PaperType,
  selectedTool: null as DiaryToolId | null,
  isLayerPanelVisible: false,
  selectedStickerPackId: DIARY_STICKER_PACKS[0]?.id ?? '',
  editingTextId: null as string | null,
});

export const useDiaryStore = create<DiaryState>(set => ({
  ...createInitialState(),

  setItems: arg =>
    set(state => ({
      items: resolve(arg, state.items),
    })),

  setSelectedItem: arg =>
    set(state => ({
      selectedItem: resolve(arg, state.selectedItem),
    })),

  setDrawingIndex: arg =>
    set(state => ({
      drawingIndex: resolve(arg, state.drawingIndex),
    })),

  setPaperType: paperType =>
    set({
      paperType,
    }),

  setSelectedTool: selectedTool =>
    set({
      selectedTool,
    }),

  setIsLayerPanelVisible: arg =>
    set(state => ({
      isLayerPanelVisible: resolve(arg, state.isLayerPanelVisible),
    })),

  setSelectedStickerPackId: selectedStickerPackId =>
    set({
      selectedStickerPackId,
    }),

  setEditingTextId: arg =>
    set(state => ({
      editingTextId: resolve(arg, state.editingTextId),
    })),

  initializeDiary: ({ items, drawingIndex, paperType }) =>
    set({
      items,
      drawingIndex,
      paperType,
      selectedItem: null,
      editingTextId: null,
      selectedTool: null,
      isLayerPanelVisible: false,
    }),

  reset: () => set(createInitialState()),
}));
