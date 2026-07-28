import type { Session } from '@supabase/supabase-js';

import type { Tables } from '../../lib/database.types';

export type AuthStatus =
  | 'loading'
  | 'signedOut'
  | 'profileRequired'
  | 'authenticated'
  | 'guest'
  | 'error';

export type UserProfile = Tables<'profiles'>;

export interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  status: AuthStatus;
  errorMessage: string | null;
  completeProfile: (profile: UserProfile) => void;
  continueAsGuest: () => void;
  retry: () => void;
  signOut: () => Promise<void>;
}
