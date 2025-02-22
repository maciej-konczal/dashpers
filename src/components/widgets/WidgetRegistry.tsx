
import React from 'react';
import { SampleWidget } from './SampleWidget';
import { SalesforceWidget } from './SalesforceWidget';
import { WidgetConfig } from '@/types/widgets';

const widgetMap: Record<string, React.FC<{ config: WidgetConfig }>> = {
  'sample': SampleWidget,
  'salesforce': SalesforceWidget,
};

export const WidgetRegistry: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const WidgetComponent = widgetMap[config.type] || SampleWidget;
  return <WidgetComponent config={config} />;
};
