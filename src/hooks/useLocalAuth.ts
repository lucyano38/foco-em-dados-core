import { useEffect, useState } from 'react';

export interface LocalUser {
  name: string;
  email: string;
  role: string;
}

export function useLocalAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');

    if (authCode) {
      const adminSession: LocalUser = {
        name: 'Administrador',
        email: 'admin@focoemdados.com.br',
        role: 'admin',
      };

      localStorage.setItem('user_session', JSON.stringify(adminSession));
      setUser(adminSession);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedSession = localStorage.getItem('user_session');
      if (savedSession) {
        try {
          setUser(JSON.parse(savedSession));
        } catch {
          localStorage.removeItem('user_session');
        }
      }
    }
  }, []);

  const signOut = () => {
    localStorage.removeItem('user_session');
    setUser(null);
  };

  return { user, setUser, signOut };
}
