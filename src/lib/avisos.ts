import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';

export type Aviso = {
  id: number;
  tipo: 'propuesta_resuelta' | 'ficha_corregida' | 'tarifa_nueva';
  titulo: string;
  cuerpo: string;
  leido_en: string | null;
  atendido_en: string | null;
  creado_en: string;
};

// Contador de avisos no leídos; se refresca cada vez que la pantalla vuelve al frente.
export function useNoLeidos() {
  const [n, setN] = useState(0);
  useFocusEffect(
    useCallback(() => {
      supabase
        .from('avisos')
        .select('id', { count: 'exact', head: true })
        .is('leido_en', null)
        .then(({ count }) => setN(count ?? 0));
    }, []),
  );
  return n;
}

// La interfaz del administrador solo se muestra si el perfil tiene ese rol; la base de datos lo verifica de nuevo.
export function useEsAdministrador() {
  const [es, setEs] = useState(false);
  useEffect(() => {
    supabase
      .from('perfiles')
      .select('rol')
      .single()
      .then(({ data }) => setEs(data?.rol === 'administrador'));
  }, []);
  return es;
}
