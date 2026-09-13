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
      source: require('../../../../assets/diary/stickers/baseball/baseball_1.png'),
    },
    {
      id: 'baseball-02',
      source: require('../../../../assets/diary/stickers/baseball/baseball_2.png'),
    },
    {
      id: 'baseball-03',
      source: require('../../../../assets/diary/stickers/baseball/baseball_3.png'),
    },
    {
      id: 'baseball-04',
      source: require('../../../../assets/diary/stickers/baseball/baseball_4.png'),
    },
    {
      id: 'baseball-05',
      source: require('../../../../assets/diary/stickers/baseball/baseball_5.png'),
    },
    {
      id: 'baseball-06',
      source: require('../../../../assets/diary/stickers/baseball/baseball_6.png'),
    },
    {
      id: 'baseball-07',
      source: require('../../../../assets/diary/stickers/baseball/baseball_7.png'),
    },
    {
      id: 'baseball-08',
      source: require('../../../../assets/diary/stickers/baseball/baseball_8.png'),
    },
    {
      id: 'baseball-09',
      source: require('../../../../assets/diary/stickers/baseball/baseball_9.png'),
    },
    {
      id: 'baseball-10',
      source: require('../../../../assets/diary/stickers/baseball/baseball_10.png'),
    },
    {
      id: 'baseball-11',
      source: require('../../../../assets/diary/stickers/baseball/baseball_11.png'),
    },
    {
      id: 'baseball-12',
      source: require('../../../../assets/diary/stickers/baseball/baseball_12.png'),
    },
    {
      id: 'baseball-13',
      source: require('../../../../assets/diary/stickers/baseball/baseball_13.png'),
    },
    {
      id: 'baseball-14',
      source: require('../../../../assets/diary/stickers/baseball/baseball_14.png'),
    },
    {
      id: 'baseball-15',
      source: require('../../../../assets/diary/stickers/baseball/baseball_15.png'),
    },
    {
      id: 'baseball-16',
      source: require('../../../../assets/diary/stickers/baseball/baseball_16.png'),
    },
    {
      id: 'baseball-17',
      source: require('../../../../assets/diary/stickers/baseball/baseball_17.png'),
    },
    {
      id: 'baseball-18',
      source: require('../../../../assets/diary/stickers/baseball/baseball_18.png'),
    },
    {
      id: 'baseball-19',
      source: require('../../../../assets/diary/stickers/baseball/baseball_19.png'),
    },
    {
      id: 'baseball-20',
      source: require('../../../../assets/diary/stickers/baseball/baseball_20.png'),
    },
    {
      id: 'baseball-21',
      source: require('../../../../assets/diary/stickers/baseball/baseball_21.png'),
    },
    {
      id: 'baseball-22',
      source: require('../../../../assets/diary/stickers/baseball/baseball_22.png'),
    },
    {
      id: 'baseball-23',
      source: require('../../../../assets/diary/stickers/baseball/baseball_23.png'),
    },
    {
      id: 'baseball-24',
      source: require('../../../../assets/diary/stickers/baseball/baseball_24.png'),
    },
  ],
};

export const MEME_STICKER_PACK: DiaryStickerPack = {
  id: 'meme',
  representativeStickerId: 'meme-01',
  stickers: [
    {
      id: 'meme-01',
      source: require('../../../../assets/diary/stickers/meme/meme_1.png'),
    },
    {
      id: 'meme-02',
      source: require('../../../../assets/diary/stickers/meme/meme_2.png'),
    },
    {
      id: 'meme-03',
      source: require('../../../../assets/diary/stickers/meme/meme_3.png'),
    },
    {
      id: 'meme-04',
      source: require('../../../../assets/diary/stickers/meme/meme_4.png'),
    },
    {
      id: 'meme-05',
      source: require('../../../../assets/diary/stickers/meme/meme_5.png'),
    },
    {
      id: 'meme-06',
      source: require('../../../../assets/diary/stickers/meme/meme_6.png'),
    },
    {
      id: 'meme-07',
      source: require('../../../../assets/diary/stickers/meme/meme_7.png'),
    },
    {
      id: 'meme-08',
      source: require('../../../../assets/diary/stickers/meme/meme_8.png'),
    },
    {
      id: 'meme-09',
      source: require('../../../../assets/diary/stickers/meme/meme_9.png'),
    },
    {
      id: 'meme-10',
      source: require('../../../../assets/diary/stickers/meme/meme_10.png'),
    },
    {
      id: 'meme-11',
      source: require('../../../../assets/diary/stickers/meme/meme_11.png'),
    },
    {
      id: 'meme-12',
      source: require('../../../../assets/diary/stickers/meme/meme_12.png'),
    },
    {
      id: 'meme-13',
      source: require('../../../../assets/diary/stickers/meme/meme_13.png'),
    },
    {
      id: 'meme-14',
      source: require('../../../../assets/diary/stickers/meme/meme_14.png'),
    },
    {
      id: 'meme-15',
      source: require('../../../../assets/diary/stickers/meme/meme_15.png'),
    },
    {
      id: 'meme-16',
      source: require('../../../../assets/diary/stickers/meme/meme_16.png'),
    },
    {
      id: 'meme-17',
      source: require('../../../../assets/diary/stickers/meme/meme_17.png'),
    },
    {
      id: 'meme-18',
      source: require('../../../../assets/diary/stickers/meme/meme_18.png'),
    },
    {
      id: 'meme-19',
      source: require('../../../../assets/diary/stickers/meme/meme_19.png'),
    },
    {
      id: 'meme-20',
      source: require('../../../../assets/diary/stickers/meme/meme_20.png'),
    },
  ],
};

export const DIARY_STICKER_PACKS: readonly DiaryStickerPack[] = [
  BREAD_STICKER_PACK,
  BASEBALL_STICKER_PACK,
  MEME_STICKER_PACK,
];
