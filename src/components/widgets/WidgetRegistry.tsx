
import React from 'react';
import { SalesforceWidget } from './SalesforceWidget';
import { PicaWidget } from './PicaWidget';
import { NoteWidget } from './NoteWidget';
import { WidgetConfig } from '@/types/widgets';

const widgetMap: Record<string, React.FC<{ config: WidgetConfig }>> = {
  'salesforce': SalesforceWidget,
  'pica': PicaWidget,
  'note': NoteWidget,
};

export const WidgetRegistry: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const WidgetComponent = widgetMap[config.type] || PicaWidget;
  return <WidgetComponent config={config} />;
};
