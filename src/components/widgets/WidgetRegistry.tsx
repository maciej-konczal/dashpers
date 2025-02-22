
import React from 'react';
import { SampleWidget } from './SampleWidget';
import { SalesforceTasksWidget } from './SalesforceTasksWidget';
import { WidgetConfig } from '@/types/widgets';

const widgetMap: Record<string, React.FC<{ config: WidgetConfig }>> = {
  'sample': SampleWidget,
  'salesforce': SalesforceTasksWidget,  // Map 'salesforce' type to SalesforceTasksWidget
  'salesforce-tasks': SalesforceTasksWidget,  // Keep backward compatibility
};

export const WidgetRegistry: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const WidgetComponent = widgetMap[config.type] || SampleWidget;
  return <WidgetComponent config={config} />;
};
