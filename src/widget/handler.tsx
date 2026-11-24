import type { WidgetTaskHandler } from 'react-native-android-widget';
import { datosWidget, renderResumen } from './datos';

export const widgetTaskHandler: WidgetTaskHandler = async ({ widgetAction, renderWidget }) => {
  if (widgetAction === 'WIDGET_ADDED' || widgetAction === 'WIDGET_UPDATE' || widgetAction === 'WIDGET_RESIZED') {
    renderWidget(renderResumen(await datosWidget()));
  }
};
