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
  bienvenida: boolean | null; // la cuenta aún no recorrió la bienvenida (null: se está consultando)
  terminarBienvenida: () => void;
};

const Contexto = createContext<Ajustes | null>(null);
const CLAVE_TEMA = 'ajuste_tema';

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
  const { bienvenida, terminarBienvenida } = useAjustes();
  return { bienvenida, terminarBienvenida };
};

export function AjustesProvider({ children }: { children: ReactNode }) {
  const { session } = useSesion();
  const [tema, setTemaEstado] = useState<Tema>('claro');
  const [cifra, setCifraEstado] = useState<Cifra>('kwh');
  const [bienvenida, setBienvenida] = useState<boolean | null>(null);
  const id = session?.user.id;

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_TEMA).then((t) => t && setTemaEstado(t as Tema)).catch(() => {});
  }, []);

  useEffect(() => {
    setBienvenida(null);
    if (!id) return;
    supabase
      .from('perfiles')
      .select('cifra_principal, bienvenida_completada')
      .single()
      .then(({ data }) => {
        if (data) setCifraEstado(data.cifra_principal as Cifra);
        // Si no se pudo consultar, mejor dejar entrar que bloquear la app.
        setBienvenida(data ? !data.bienvenida_completada : false);
      });
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
  // La bienvenida es de la cuenta: se marca en el perfil y no vuelve en otro teléfono.
  const terminarBienvenida = () => {
    setBienvenida(false);
    supabase.from('perfiles').update({ bienvenida_completada: true }).eq('id', id!).then(() => {});
  };

  return (
    <Contexto.Provider value={{ tema, setTema, cifra, setCifra, bienvenida, terminarBienvenida }}>
      {children}
    </Contexto.Provider>
  );
}
