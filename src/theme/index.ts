import { MD3DarkTheme, MD3LightTheme, configureFonts, type MD3Theme } from 'react-native-paper';

export const fonts = {
  slab: 'ZillaSlab_700Bold',
  slabMedium: 'ZillaSlab_500Medium',
  body: 'AtkinsonHyperlegible_400Regular',
  bodyBold: 'AtkinsonHyperlegible_700Bold',
};

const fontConfig = {
  fontFamily: fonts.body,
  displayLarge: { fontFamily: fonts.slab },
  displayMedium: { fontFamily: fonts.slab },
  // La cifra principal (Cifra, Racha): escala con la fuente del sistema, sin altura fija.
  displaySmall: { fontFamily: fonts.slab, fontSize: 40, lineHeight: 48 },
  headlineLarge: { fontFamily: fonts.slab },
  headlineMedium: { fontFamily: fonts.slab },
  headlineSmall: { fontFamily: fonts.slab },
  titleLarge: { fontFamily: fonts.slab },
  titleMedium: { fontFamily: fonts.slabMedium },
  titleSmall: { fontFamily: fonts.slabMedium },
  labelLarge: { fontFamily: fonts.bodyBold },
  labelMedium: { fontFamily: fonts.bodyBold },
  labelSmall: { fontFamily: fonts.bodyBold },
};

// Almanaque: amarillo encabezado, rojo solo para acción principal y hoy, verde = dentro del presupuesto.
export const almanaque = {
  amarillo: '#F6C12E',
  rojo: '#C8312B',
  tinta: '#1D1A16',
  verde: '#3D7F4E',
};

// Encabezado amarillo: par fijo en ambos temas (tinta sobre amarillo, ~11:1); no se invierte en oscuro.
export const encabezado = { fondo: almanaque.amarillo, texto: almanaque.tinta };

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: almanaque.rojo,
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFDAD5',
    onPrimaryContainer: '#410003',
    secondary: almanaque.verde,
    onSecondary: '#FFFFFF',
    secondaryContainer: '#BFEFC8',
    onSecondaryContainer: '#00210D',
    tertiary: almanaque.amarillo,
    onTertiary: almanaque.tinta,
    tertiaryContainer: '#FFE08A',
    onTertiaryContainer: almanaque.tinta,
    background: '#FFFFFF',
    onBackground: almanaque.tinta,
    surface: '#FFFFFF',
    onSurface: almanaque.tinta,
    surfaceVariant: '#F4EFE4',
    onSurfaceVariant: '#4C463C',
    outline: '#CFC8B8',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FF8A7F',
    onPrimary: '#5F0B08',
    primaryContainer: '#8E1B16',
    onPrimaryContainer: '#FFDAD5',
    secondary: '#7FCF92',
    onSecondary: '#00391B',
    secondaryContainer: '#1F5A33',
    onSecondaryContainer: '#BFEFC8',
    tertiary: '#F6C12E',
    onTertiary: '#3F2E00',
    tertiaryContainer: '#5A4300',
    onTertiaryContainer: '#FFE08A',
    background: '#16130F',
    onBackground: '#EDE6D8',
    surface: '#16130F',
    onSurface: '#EDE6D8',
    surfaceVariant: '#2A251D',
    onSurfaceVariant: '#CFC8B8',
    outline: '#6E6759',
  },
};
