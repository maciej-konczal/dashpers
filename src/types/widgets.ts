
export type WidgetType = 'salesforce' | 'pica' | 'note';

export interface WidgetPreferences {
  sequence?: number;
  [key: string]: any;
}

interface SalesforceColumn {
  field: string;
  label: string;
  format?: 'date';
}

export interface SalesforceWidgetPreferences extends WidgetPreferences {
  backgroundColor?: string;
  soql_query?: string;
  show_totals?: boolean;
  chart_type?: 'table' | 'bar' | 'line';
  max_records?: number;
  columns?: SalesforceColumn[];
  refreshInterval?: number;
}

export interface PicaWidgetPreferences extends WidgetPreferences {
  prompt: string;
  tool?: string;
  maxSteps?: number;
  backgroundColor?: string;
  refreshInterval?: number;
}

export interface NoteWidgetPreferences extends WidgetPreferences {
  content: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  padding?: string;
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
