import { supabase } from '../lib/supabaseClient';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  user: User | null;
  error: string | null;
}

// Helper to detect if error is due to Supabase being paused/unavailable
function isConnectionError(error: any): boolean {
  const errorMsg = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || '';

  // Common patterns for connection/network failures
  return (
    errorMsg.includes('failed to fetch') ||
    errorMsg.includes('network') ||
    errorMsg.includes('timeout') ||
    errorMsg.includes('connection') ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ETIMEDOUT'
  );
}

function getFriendlyErrorMessage(error: any): string {
  if (isConnectionError(error)) {
    return '⚠️ Não foi possível conectar ao servidor. O sistema pode estar temporariamente inativo. Entre em contato com o suporte para reativar o acesso.';
  }
  return error?.message || 'Erro desconhecido';
}

export async function signUp(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return {
        user: null,
        error: getFriendlyErrorMessage(error),
      };
    }

    if (data.user) {
      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at || new Date().toISOString(),
        },
        error: null,
      };
    }

    return {
      user: null,
      error: 'Failed to create user',
    };
  } catch (err) {
    return {
      user: null,
      error: getFriendlyErrorMessage(err),
    };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        user: null,
        error: getFriendlyErrorMessage(error),
      };
    }

    if (data.user) {
      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at || new Date().toISOString(),
        },
        error: null,
      };
    }

    return {
      user: null,
      error: 'Failed to sign in',
    };
  } catch (err) {
    return {
      user: null,
      error: getFriendlyErrorMessage(err),
    };
  }
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (err) {
    console.error('Sign out error:', err);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      created_at: user.created_at || new Date().toISOString(),
    };
  } catch (err) {
    console.error('Get current user error:', err);
    return null;
  }
}

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email || '',
        created_at: session.user.created_at || new Date().toISOString(),
      });
    } else {
      callback(null);
    }
  });

  getCurrentUser().then(callback);

  return () => {
    data.subscription.unsubscribe();
  };
}
