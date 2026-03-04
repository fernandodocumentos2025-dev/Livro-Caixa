import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as authService from '../services/authService';

interface AuthContextType {
  user: authService.User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  recoveryMode: boolean;
  setRecoveryMode: (mode: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authService.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    const isMock = !import.meta.env.VITE_SUPABASE_URL;

    if (isMock) {

      setUser({
        id: 'mock-user-id',
        email: 'teste@exemplo.com',
        created_at: new Date().toISOString()
      });
      setLoading(false);
      return;
    }

    authService.getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    const unsubscribe = authService.onAuthStateChange((currentUser, event) => {
      setUser(currentUser);
      setLoading(false);
      // Supabase emite PASSWORD_RECOVERY quando o usuário clica no link do email
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      return { error: null };
    }
    const response = await authService.signUp(email, password);
    return { error: response.error };
  };

  const signIn = async (email: string, password: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setUser({
        id: 'mock-user-id',
        email: email,
        created_at: new Date().toISOString()
      });
      return { error: null };
    }

    const response = await authService.signIn(email, password);
    if (response.user) {
      setUser(response.user);
    }
    return { error: response.error };
  };

  const signOut = async () => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      setUser(null);
      localStorage.removeItem('empresa_nome');
      return;
    }
    await authService.signOut();
    localStorage.removeItem('empresa_nome');
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      return { error: null };
    }
    const response = await authService.resetPassword(email);
    return { error: response.error };
  };

  const updatePassword = async (password: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      return { error: null };
    }
    const response = await authService.updatePassword(password);
    return { error: response.error };
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, resetPassword, updatePassword, recoveryMode, setRecoveryMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
