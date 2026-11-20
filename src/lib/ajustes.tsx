import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import type { Tema } from '@/lib/tema';
export type { Tema };

export type Cifra = 'kwh' | 'pesos';


type Ajustes = {
  tema: Tema;
  setTema: (t: Tema) => void;
  cifra: Cifra; // cifra principal: la que el Mes muestra grande (kWh por defecto)
  setCifra: (c: Cifra) => void;
  bienvenida: boolean; // recién registrada en este teléfono: falta recorrer la bienvenida
  iniciarBienvenida: () => void;
  terminarBienvenida: () => void;
};

const Contexto = createContext<Ajustes | null>(null);
const CLAVE_TEMA = 'ajuste_tema';
const CLAVE_BIENVENIDA = 'bienvenida_pendiente';

function useAjustes() {
  const a = useContext(Contexto);
  if (!a) throw new Error('useAjustes fuera de AjustesProvider');
  return a;
}

/** Cifra principal del perfil: `const [cifra, setCifra] = useCifraPrincipal()`. */
export function useCifraPrincipal() {
  const { cifra, setCifra } = useAjustes();
  return [cifra, setCifra] as const;
}
export const useTema = () => {
  const { tema, setTema } = useAjustes();
  return [tema, setTema] as const;
};
export const useBienvenida = () => {
  const { bienvenida, iniciarBienvenida, terminarBienvenida } = useAjustes();
  return { bienvenida, iniciarBienvenida, terminarBienvenida };
};

export function AjustesProvider({ children }: { children: ReactNode }) {
  const { session } = useSesion();
  const [tema, setTemaEstado] = useState<Tema>('sistema');
  const [cifra, setCifraEstado] = useState<Cifra>('kwh');
  const [bienvenida, setBienvenida] = useState(false);
  const id = session?.user.id;

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_TEMA).then((t) => t && setTemaEstado(t as Tema)).catch(() => {});
    AsyncStorage.getItem(CLAVE_BIENVENIDA).then((v) => setBienvenida(v === '1')).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('perfiles')
      .select('cifra_principal')
      .single()
      .then(({ data }) => data && setCifraEstado(data.cifra_principal as Cifra));
  }, [id]);

  const setTema = (t: Tema) => {
    setTemaEstado(t);
    AsyncStorage.setItem(CLAVE_TEMA, t).catch(() => {});
  };
  const setCifra = (c: Cifra) => {
    const antes = cifra;
    setCifraEstado(c);
    supabase.from('perfiles').update({ cifra_principal: c }).eq('id', id!).then(({ error }) => error && setCifraEstado(antes));
  };
  // Se marca antes de crear la cuenta: al llegar la sesión, el guard de rutas ya lleva a la bienvenida.
  const iniciarBienvenida = () => {
    setBienvenida(true);
    AsyncStorage.setItem(CLAVE_BIENVENIDA, '1').catch(() => {});
  };
  const terminarBienvenida = () => {
    setBienvenida(false);
    AsyncStorage.removeItem(CLAVE_BIENVENIDA).catch(() => {});
  };

  return (
    <Contexto.Provider value={{ tema, setTema, cifra, setCifra, bienvenida, iniciarBienvenida, terminarBienvenida }}>
      {children}
    </Contexto.Provider>
  );
}
