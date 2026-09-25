import NativeTicketTextRecognizer from '../../../specs/NativeTicketTextRecognizer';

export const recognizeTicketText = (imageUri: string) =>
  NativeTicketTextRecognizer.recognizeText(imageUri);
