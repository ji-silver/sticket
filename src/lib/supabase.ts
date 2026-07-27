import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

import { publicConfig } from '../config/publicConfig';
import type { Database } from './database.types';

export const supabase = createClient<Database>(
  publicConfig.supabaseUrl,
  publicConfig.supabasePublishableKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  },
);
