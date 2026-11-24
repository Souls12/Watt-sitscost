import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export type DatosWidget = { titulo: string; cifra: string; detalle: string; racha: number };

export function WidgetResumen({ titulo, cifra, detalle, racha, oscuro }: DatosWidget & { oscuro: boolean }) {
  const texto = oscuro ? '#F5EFE0' : '#1F1B13';
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: oscuro ? '#1F1B13' : '#FFFBF0',
        borderRadius: 16,
        padding: 12,
        justifyContent: 'center',
      }}
    >
      <TextWidget text={titulo} style={{ fontSize: 12, color: '#F6C12E', fontWeight: 'bold' }} />
      <TextWidget text={cifra} style={{ fontSize: 30, fontWeight: 'bold', color: texto }} />
      <TextWidget text={detalle} style={{ fontSize: 14, color: texto }} />
      {racha > 0 ? <TextWidget text={`Racha: ${racha} días`} style={{ fontSize: 12, color: '#F6C12E' }} /> : null}
    </FlexWidget>
  );
}
