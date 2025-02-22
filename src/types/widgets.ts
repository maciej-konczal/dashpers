
export type WidgetType = 'salesforce' | 'slack' | 'news' | 'weather' | 'calendar' | 'chart';

export interface WidgetPreferences {
  [key: string]: any;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  preferences: WidgetPreferences;
}

export interface WidgetData {
  id: string;
  type: WidgetType;
  title: string;
  preferences: WidgetPreferences;
}
