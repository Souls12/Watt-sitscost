import { Icon, useTheme } from 'react-native-paper';
import { useColoresTipo } from '@/lib/aparatos';
import { iconoTipo } from '@/lib/iconosTipo';

// Icono del tipo de aparato, con el color fijo del tipo.
export function IconoTipo({ tipo, size = 28, color }: { tipo: string; size?: number; color?: string }) {
  const colores = useColoresTipo();
  const theme = useTheme();
  return <Icon source={iconoTipo(tipo)} size={size} color={color ?? colores[tipo] ?? theme.colors.outline} />;
}
