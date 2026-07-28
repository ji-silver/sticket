import {
  useCallback,
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase';
import { getProfile } from '../profile/profile.service';
import type {
  AuthContextValue,
  AuthStatus,
  UserProfile,
} from './auth.types';

const AuthContext = createContext<AuthContextValue | null>(null);

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : '로그인 정보를 확인하지 못했습니다.';
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null | undefined>(
    undefined,
  );
  const [isGuest, setIsGuest] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profileRequestVersion, setProfileRequestVersion] = useState(0);
  const sessionUserIdRef = useRef<string | undefined>(undefined);

  const loadSession = useCallback(async () => {
    setErrorMessage(null);
    setSession(undefined);
    setProfile(undefined);

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      sessionUserIdRef.current = undefined;
      setSession(null);
      setProfile(null);
      setErrorMessage(getErrorMessage(error));
      return;
    }

    sessionUserIdRef.current = data.session?.user.id;
    setSession(data.session);
    setProfile(data.session ? undefined : null);
  }, []);

  useEffect(() => {
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUserId = nextSession?.user.id;

      setErrorMessage(null);
      setIsGuest(false);
      setSession(nextSession);

      if (sessionUserIdRef.current !== nextUserId) {
        sessionUserIdRef.current = nextUserId;
        setProfile(nextSession ? undefined : null);
      }
    });

    const appStateSubscription = AppState.addEventListener(
      'change',
      nextAppState => {
        if (nextAppState === 'active') {
          supabase.auth.startAutoRefresh();
        } else {
          supabase.auth.stopAutoRefresh();
        }
      },
    );

    if (AppState.currentState === 'active') {
      supabase.auth.startAutoRefresh();
    }

    return () => {
      subscription.unsubscribe();
      appStateSubscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, [loadSession]);

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isActive = true;

    getProfile(userId)
      .then(nextProfile => {
        if (isActive) {
          setProfile(nextProfile);
          setErrorMessage(null);
        }
      })
      .catch(error => {
        if (isActive) {
          setErrorMessage(getErrorMessage(error));
        }
      });

    return () => {
      isActive = false;
    };
  }, [profileRequestVersion, userId]);

  let status: AuthStatus;

  if (errorMessage) {
    status = 'error';
  } else if (session === undefined) {
    status = 'loading';
  } else if (!session) {
    status = isGuest ? 'guest' : 'signedOut';
  } else if (profile === undefined) {
    status = 'loading';
  } else if (!profile) {
    status = 'profileRequired';
  } else {
    status = 'authenticated';
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session: session ?? null,
      profile: profile ?? null,
      status,
      errorMessage,
      completeProfile: nextProfile => {
        setProfile(nextProfile);
        setErrorMessage(null);
      },
      continueAsGuest: () => {
        setIsGuest(true);
        setErrorMessage(null);
      },
      retry: () => {
        setErrorMessage(null);

        if (session) {
          setProfile(undefined);
          setProfileRequestVersion(current => current + 1);
          return;
        }

        loadSession();
      },
      signOut: async () => {
        if (!session) {
          setIsGuest(false);
          return;
        }

        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }

        setSession(null);
        setProfile(null);
        setIsGuest(false);
        sessionUserIdRef.current = undefined;
      },
    }),
    [errorMessage, loadSession, profile, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서 사용해야 합니다.');
  }

  return context;
}
