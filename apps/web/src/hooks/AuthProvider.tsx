import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

import type { User } from '@flashcard-app/shared-types';
import { supabase } from '../lib/supabase';
import * as api from '../services/api';
import { AuthContext } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        api
          .getMe()
          .then((data) => setUser(data.user))
          .catch(() => setUser(null))
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/reset-password';
        return;
      }
      if (!session) {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const data = await api.getMe();
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const { data: signUpData, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (!signUpData.session) {
      throw new Error(
        'Email confirmation required. Please check your inbox and confirm your email before continuing.',
      );
    }

    const data = await api.registerUser(name);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
