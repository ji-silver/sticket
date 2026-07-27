import { Session } from '@supabase/supabase-js';

export interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}
