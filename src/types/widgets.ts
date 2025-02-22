
export type WidgetType = 'salesforce' | 'slack' | 'news' | 'weather' | 'calendar' | 'chart';

export interface BaseWidgetPreferences {
  backgroundColor?: string;
  borderRadius?: string;
  padding?: string;
  shadow?: string;
  refreshInterval?: number;
  height?: string;
  width?: string;
}

export interface SalesforceWidgetPreferences extends BaseWidgetPreferences {
  soql_query: string;
  show_totals?: boolean;
  chart_type?: 'table' | 'bar' | 'pie' | 'line';
  max_records?: number;
  object_type?: string;
  fields_to_display?: string[];
}

export interface SlackWidgetPreferences extends BaseWidgetPreferences {
  channel_id?: string;
  message_count?: number;
  show_reactions?: boolean;
  show_threads?: boolean;
  notification_types?: ('mentions' | 'direct_messages' | 'channel_messages')[];
}

export interface NewsWidgetPreferences extends BaseWidgetPreferences {
  categories?: string[];
  sources?: string[];
  article_count?: number;
  show_thumbnails?: boolean;
  layout_type?: 'card' | 'list' | 'grid';
  sort_by?: 'latest' | 'popular' | 'relevant';
}

export interface WeatherWidgetPreferences extends BaseWidgetPreferences {
  location?: string;
  units?: 'celsius' | 'fahrenheit';
  show_forecast_days?: number;
  show_hourly?: boolean;
  show_details?: boolean;
  alerts?: boolean;
}

export interface CalendarWidgetPreferences extends BaseWidgetPreferences {
  calendar_ids?: string[];
  view_type?: 'month' | 'week' | 'day' | 'agenda';
  show_all_day_events?: boolean;
  days_to_show?: number;
  categories?: string[];
}

export interface ChartWidgetPreferences extends BaseWidgetPreferences {
  chart_type?: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  data_source?: string;
  show_legend?: boolean;
  show_grid?: boolean;
  colors?: string[];
  animation?: boolean;
  stacked?: boolean;
}

export type WidgetPreferences = 
  | SalesforceWidgetPreferences 
  | SlackWidgetPreferences 
  | NewsWidgetPreferences 
  | WeatherWidgetPreferences 
  | CalendarWidgetPreferences 
  | ChartWidgetPreferences;

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  preferences: WidgetPreferences;
  data?: any;
  connection_id?: string;
}

export interface WidgetTypeConfig {
  type: WidgetType;
  default_title: string;
  available_preferences: WidgetPreferences;
  description: string;
  required_connection_type?: string;
}
