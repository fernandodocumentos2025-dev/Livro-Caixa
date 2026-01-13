import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as authService from '../services/authService';

interface AuthContextType {
  user: authService.User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authService.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isMock = !import.meta.env.VITE_SUPABASE_URL;

    if (isMock) {
      console.log('⚠️ Modo Mock Ativado: Usando usuário de teste.');
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

    const unsubscribe = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
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

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
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
