import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  recognizeText(imageUri: string): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeTicketTextRecognizer',
);
