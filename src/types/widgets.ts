
export type WidgetType = 'salesforce' | 'slack' | 'news' | 'weather' | 'calendar' | 'chart';

export interface WidgetPreferences {
  [key: string]: any;
}

export interface SalesforceWidgetPreferences extends WidgetPreferences {
  backgroundColor?: string;
  soql_query?: string;
  show_totals?: boolean;
  chart_type?: 'table' | 'bar' | 'line';
  max_records?: number;
  fields_to_display?: string[];
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  preferences: WidgetPreferences;
  content?: string;
}

export interface WidgetData extends WidgetConfig {
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}
