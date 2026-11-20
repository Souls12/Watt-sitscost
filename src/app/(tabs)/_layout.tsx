import { Tabs } from 'expo-router/js-tabs';
import { BottomNavigation, Icon, useTheme } from 'react-native-paper';

const destinos = [
  { name: 'index', title: 'Mes', icon: 'calendar-month' },
  { name: 'semanas', title: 'Semanas', icon: 'calendar-week' },
  { name: 'aparatos', title: 'Aparatos', icon: 'power-plug' },
  { name: 'factura', title: 'Factura', icon: 'receipt-text' },
] as const;

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ emitter, navigateToTab, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          onTabPress={({ route, preventDefault }) => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (event.defaultPrevented) preventDefault();
            else navigateToTab(route.key);
          }}
          renderIcon={({ route, focused, color }) =>
            descriptors[route.key].options.tabBarIcon?.({ focused, color, size: 24 }) ?? null
          }
          getLabelText={({ route }) => descriptors[route.key].options.title ?? route.name}
          style={{ backgroundColor: theme.colors.surface }}
        />
      )}
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
