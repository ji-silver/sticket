import type { Session } from '@supabase/supabase-js';

import type { Tables } from '../../lib/database.types';

export type AuthStatus =
  | 'loading'
  | 'signedOut'
  | 'profileRequired'
  | 'authenticated'
  | 'error';

export type UserProfile = Tables<'profiles'> & {
  favorite_team: Pick<
    Tables<'teams'>,
    'id' | 'name' | 'short_name' | 'sport'
  > | null;
};

export interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  status: AuthStatus;
  errorMessage: string | null;
  completeProfile: (profile: UserProfile) => void;
  retry: () => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
}
