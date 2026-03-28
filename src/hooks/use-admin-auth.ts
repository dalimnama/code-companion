import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

async function checkAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });

  if (error) {
    console.error('Admin check failed:', error.message);
    return false;
  }

  return data === true;
}

// Shared auth state to prevent re-initialization race conditions
let sharedState: { user: User | null; isAdmin: boolean; ready: boolean } = {
  user: null,
  isAdmin: false,
  ready: false,
};

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(sharedState.user);
  const [isAdmin, setIsAdmin] = useState(sharedState.isAdmin);
  const [loading, setLoading] = useState(!sharedState.ready);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted.current) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        sharedState.user = currentUser;

        if (currentUser) {
          setTimeout(() => {
            if (!isMounted.current) return;
            checkAdmin(currentUser.id).then(admin => {
              if (isMounted.current) {
                setIsAdmin(admin);
                sharedState.isAdmin = admin;
              }
            });
          }, 0);
        } else {
          setIsAdmin(false);
          sharedState.isAdmin = false;
        }
      }
    );

    // Only do initial load if shared state isn't ready yet
    if (!sharedState.ready) {
      const initializeAuth = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!isMounted.current) return;

          const currentUser = session?.user ?? null;
          setUser(currentUser);
          sharedState.user = currentUser;

          if (currentUser) {
            const admin = await checkAdmin(currentUser.id);
            if (isMounted.current) {
              setIsAdmin(admin);
              sharedState.isAdmin = admin;
            }
          }
        } finally {
          if (isMounted.current) {
            sharedState.ready = true;
            setLoading(false);
          }
        }
      };
      initializeAuth();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        return { error: error ?? new Error('Login failed'), isAdmin: false };
      }

      const admin = await checkAdmin(data.user.id);
      setUser(data.user);
      setIsAdmin(admin);

      // Update shared state so AdminLayout doesn't reset
      sharedState.user = data.user;
      sharedState.isAdmin = admin;
      sharedState.ready = true;

      return { error: null, isAdmin: admin };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Unexpected login error'),
        isAdmin: false,
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setIsAdmin(false);
    sharedState = { user: null, isAdmin: false, ready: false };
    await supabase.auth.signOut();
  }, []);

  return { user, isAdmin, loading, signIn, signOut };
}
