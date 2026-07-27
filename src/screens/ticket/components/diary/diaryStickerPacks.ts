import { type ImageRequireSource } from 'react-native';

export interface DiaryStickerDefinition {
  id: string;
  source: ImageRequireSource;
}

export interface DiaryStickerPack {
  id: string;
  representativeStickerId: string;
  stickers: readonly DiaryStickerDefinition[];
}

export const BREAD_STICKER_PACK: DiaryStickerPack = {
  id: 'bread',
  representativeStickerId: 'bread-01',
  stickers: [
    {
      id: 'bread-01',
      source: require('../../../../assets/diary/stickers/bread/original_1.png'),
    },
    {
      id: 'bread-02',
      source: require('../../../../assets/diary/stickers/bread/original_2.png'),
    },
    {
      id: 'bread-03',
      source: require('../../../../assets/diary/stickers/bread/original_3.png'),
    },
    {
      id: 'bread-04',
      source: require('../../../../assets/diary/stickers/bread/original_4.png'),
    },
    {
      id: 'bread-05',
      source: require('../../../../assets/diary/stickers/bread/original_5.png'),
    },
    {
      id: 'bread-06',
      source: require('../../../../assets/diary/stickers/bread/original_6.png'),
    },
    {
      id: 'bread-07',
      source: require('../../../../assets/diary/stickers/bread/original_7.png'),
    },
    {
      id: 'bread-08',
      source: require('../../../../assets/diary/stickers/bread/original_8.png'),
    },
    {
      id: 'bread-09',
      source: require('../../../../assets/diary/stickers/bread/original_9.png'),
    },
    {
      id: 'bread-10',
      source: require('../../../../assets/diary/stickers/bread/original_10.png'),
    },
    {
      id: 'bread-11',
      source: require('../../../../assets/diary/stickers/bread/original_11.png'),
    },
    {
      id: 'bread-12',
      source: require('../../../../assets/diary/stickers/bread/original_12.png'),
    },
    {
      id: 'bread-13',
      source: require('../../../../assets/diary/stickers/bread/original_13.png'),
    },
    {
      id: 'bread-14',
      source: require('../../../../assets/diary/stickers/bread/original_14.png'),
    },
    {
      id: 'bread-15',
      source: require('../../../../assets/diary/stickers/bread/original_15.png'),
    },
    {
      id: 'bread-16',
      source: require('../../../../assets/diary/stickers/bread/original_16.png'),
    },
    {
      id: 'bread-17',
      source: require('../../../../assets/diary/stickers/bread/original_17.png'),
    },
    {
      id: 'bread-18',
      source: require('../../../../assets/diary/stickers/bread/original_18.png'),
    },
    {
      id: 'bread-19',
      source: require('../../../../assets/diary/stickers/bread/original_19.png'),
    },
    {
      id: 'bread-20',
      source: require('../../../../assets/diary/stickers/bread/original_20.png'),
    },
    {
      id: 'bread-21',
      source: require('../../../../assets/diary/stickers/bread/original_21.png'),
    },
    {
      id: 'bread-22',
      source: require('../../../../assets/diary/stickers/bread/original_22.png'),
    },
    {
      id: 'bread-23',
      source: require('../../../../assets/diary/stickers/bread/original_23.png'),
    },
    {
      id: 'bread-24',
      source: require('../../../../assets/diary/stickers/bread/original_24.png'),
    },
  ],
};

export const BASEBALL_STICKER_PACK: DiaryStickerPack = {
  id: 'baseball',
  representativeStickerId: 'baseball-01',
  stickers: [
    {
      id: 'baseball-01',
      source: require('../../../../assets/diary/stickers/baseball/original_24.png'),
    },
    {
      id: 'baseball-02',
      source: require('../../../../assets/diary/stickers/baseball/original_23.png'),
    },
    {
      id: 'baseball-03',
      source: require('../../../../assets/diary/stickers/baseball/original_22.png'),
    },
    {
      id: 'baseball-04',
      source: require('../../../../assets/diary/stickers/baseball/original_21.png'),
    },
    {
      id: 'baseball-05',
      source: require('../../../../assets/diary/stickers/baseball/original_20.png'),
    },
    {
      id: 'baseball-06',
      source: require('../../../../assets/diary/stickers/baseball/original_19.png'),
    },
    {
      id: 'baseball-07',
      source: require('../../../../assets/diary/stickers/baseball/original_18.png'),
    },
    {
      id: 'baseball-08',
      source: require('../../../../assets/diary/stickers/baseball/original_17.png'),
    },
    {
      id: 'baseball-09',
      source: require('../../../../assets/diary/stickers/baseball/original_16.png'),
    },
    {
      id: 'baseball-10',
      source: require('../../../../assets/diary/stickers/baseball/original_15.png'),
    },
    {
      id: 'baseball-11',
      source: require('../../../../assets/diary/stickers/baseball/original_14.png'),
    },
    {
      id: 'baseball-12',
      source: require('../../../../assets/diary/stickers/baseball/original_13.png'),
    },
    {
      id: 'baseball-13',
      source: require('../../../../assets/diary/stickers/baseball/original_12.png'),
    },
    {
      id: 'baseball-14',
      source: require('../../../../assets/diary/stickers/baseball/original_11.png'),
    },
    {
      id: 'baseball-15',
      source: require('../../../../assets/diary/stickers/baseball/original_10.png'),
    },
    {
      id: 'baseball-16',
      source: require('../../../../assets/diary/stickers/baseball/original_9.png'),
    },
    {
      id: 'baseball-17',
      source: require('../../../../assets/diary/stickers/baseball/original_8.png'),
    },
    {
      id: 'baseball-18',
      source: require('../../../../assets/diary/stickers/baseball/original_7.png'),
    },
    {
      id: 'baseball-19',
      source: require('../../../../assets/diary/stickers/baseball/original_6.png'),
    },
    {
      id: 'baseball-20',
      source: require('../../../../assets/diary/stickers/baseball/original_5.png'),
    },
    {
      id: 'baseball-21',
      source: require('../../../../assets/diary/stickers/baseball/original_4.png'),
    },
    {
      id: 'baseball-22',
      source: require('../../../../assets/diary/stickers/baseball/original_3.png'),
    },
    {
      id: 'baseball-23',
      source: require('../../../../assets/diary/stickers/baseball/original_2.png'),
    },
    {
      id: 'baseball-24',
      source: require('../../../../assets/diary/stickers/baseball/original_1.png'),
    },
  ],
};

export const DIARY_STICKER_PACKS: readonly DiaryStickerPack[] = [
  BREAD_STICKER_PACK,
  BASEBALL_STICKER_PACK,
];
