import { useState } from 'react';
import { Configuracion } from '@/components/bienvenida/Configuracion';
import { Intro } from '@/components/bienvenida/Intro';
import { useBienvenida } from '@/lib/ajustes';

// Bienvenida de la cuenta nueva (o que aún no la ha visto): presentación de tres pantallas y configuración guiada.
// Al terminar se marca en el perfil y el guard de _layout lleva a las pestañas (Mes). La ayuda sigue en /tutorial.
export default function Bienvenida() {
  const { terminarBienvenida } = useBienvenida();
  const [fase, setFase] = useState<'intro' | 'configuracion'>('intro');
  return fase === 'intro' ? (
    <Intro onTerminar={() => setFase('configuracion')} />
  ) : (
    <Configuracion onTerminar={terminarBienvenida} />
  );
}
