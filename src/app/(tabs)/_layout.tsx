import { Tabs } from 'expo-router/js-tabs';
import { useTransicionPestanas } from '@/motion';
import { useWindowDimensions } from 'react-native';
import { BottomNavigation, Icon, useTheme } from 'react-native-paper';
import { RielNavegacion } from '@/components/RielNavegacion';

const destinos = [
  { name: 'index', title: 'Mes', icon: 'calendar-month' },
  { name: 'semanas', title: 'Semanas', icon: 'calendar-week' },
  { name: 'aparatos', title: 'Aparatos', icon: 'power-plug' },
  { name: 'factura', title: 'Factura', icon: 'receipt-text' },
] as const;

export default function TabsLayout() {
  const theme = useTheme();
  const transicion = useTransicionPestanas();
  const expandido = useWindowDimensions().width >= 840; // clase de ancho expandida de Material 3: riel en vez de barra
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarPosition: expandido ? 'left' : 'bottom', ...transicion }}
      tabBar={({ emitter, navigateToTab, state, descriptors, insets }) => {
        const pulsar = (key: string, preventDefault?: () => void) => {
          const event = emitter.emit({ type: 'tabPress', target: key, canPreventDefault: true });
          if (event.defaultPrevented) preventDefault?.();
          else navigateToTab(key);
        };
        if (expandido)
          return (
            <RielNavegacion
              destinos={state.routes.map((route, i) => ({
                key: route.key,
                titulo: descriptors[route.key].options.title ?? route.name,
                icono: destinos.find((d) => d.name === route.name)?.icon ?? 'circle',
                activo: state.index === i,
                alPulsar: () => pulsar(route.key),
              }))}
            />
          );
        return (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          onTabPress={({ route, preventDefault }) => pulsar(route.key, preventDefault)}
          renderIcon={({ route, focused, color }) =>
            descriptors[route.key].options.tabBarIcon?.({ focused, color, size: 24 }) ?? null
          }
          getLabelText={({ route }) => descriptors[route.key].options.title ?? route.name}
          style={{ backgroundColor: theme.colors.surface }}
        />
        );
      }}
    >
      {destinos.map((d) => (
        <Tabs.Screen
          key={d.name}
          name={d.name}
          options={{
            title: d.title,
            tabBarIcon: ({ color }) => <Icon source={d.icon} size={24} color={color as string} />,
          }}
        />
      ))}
    </Tabs>
  );
}
