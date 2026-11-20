import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// A dónde vuelven los enlaces de confirmación y recuperación (debe estar en Redirect URLs de Supabase).
export const urlRetorno = Linking.createURL('/');

type Sesion = {
  session: Session | null;
  cargando: boolean;
  recuperando: boolean; // entró con el enlace de "Olvidé mi contraseña": debe fijar una nueva
  aviso: string | null; // mensaje del último enlace de correo (confirmado, vencido...)
  terminarRecuperacion: () => void;
  limpiarAviso: () => void;
};

const Contexto = createContext<Sesion | null>(null);

export function useSesion() {
  const s = useContext(Contexto);
  if (!s) throw new Error('useSesion fuera de SesionProvider');
  return s;
}

// Los enlaces del correo traen los tokens (o el error) en el fragmento: #access_token=...&type=signup
async function abrirEnlace(url: string) {
  const crudo = url.split('#')[1] ?? url.split('?')[1];
  if (!crudo) return null;
  const p = new URLSearchParams(crudo);
  if (p.get('error_description')) return { aviso: 'El enlace venció o ya se usó. Pide uno nuevo.' };
  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return { aviso: 'No pudimos abrir el enlace. Intenta de nuevo.' };
  return p.get('type') === 'recovery'
    ? { recuperando: true }
    : { aviso: 'Tu correo quedó confirmado.' };
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);
  const [recuperando, setRecuperando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const url = Linking.useLinkingURL();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      setSession(s);
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true);
    });
    // Recomendación de Supabase para React Native: refrescar el token solo con la app en primer plano.
    const app = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => {
      data.subscription.unsubscribe();
      app.remove();
    };
  }, []);

  useEffect(() => {
    if (!url) return;
    abrirEnlace(url).then((r) => {
      if (r?.recuperando) setRecuperando(true);
      if (r?.aviso) setAviso(r.aviso);
    });
  }, [url]);

  return (
    <Contexto.Provider
      value={{
        session,
        cargando,
        recuperando,
        aviso,
        terminarRecuperacion: () => setRecuperando(false),
        limpiarAviso: () => setAviso(null),
      }}
    >
      {children}
    </Contexto.Provider>
  );
}
