
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WidgetConfig, SalesforceWidgetPreferences } from '@/types/widgets';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const tailwindToHex: Record<string, string> = {
  'bg-red': '#ef4444',    // red-500
  'bg-blue': '#3b82f6',   // blue-500
  'bg-green': '#22c55e',  // green-500
  'bg-yellow': '#eab308', // yellow-500
  'bg-purple': '#a855f7', // purple-500
  'bg-white': '#ffffff',
  'bg-gray': '#6b7280',   // gray-500
};

interface SalesforceWidgetProps {
  config: WidgetConfig;
}

export const SalesforceWidget: React.FC<SalesforceWidgetProps> = ({ config }) => {
  const preferences = config.preferences as SalesforceWidgetPreferences;
  
  const {
    backgroundColor = 'bg-white',
    soql_query,
    show_totals = false,
    chart_type = 'table',
    max_records = 10,
    fields_to_display = [],
  } = preferences;

  console.log('Using background color:', backgroundColor);

  const { data: salesforceData, isLoading, error } = useQuery({
    queryKey: ['salesforce-data', config.id, soql_query],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('salesforce-tasks', {
        body: {
          query: soql_query,
          maxRecords: max_records
        }
      });
      if (error) throw error;
      return data.records;
    }
  });

  const renderTableView = (data: any[]) => {
    if (!data || data.length === 0) return <p>No data available</p>;

    const fields = fields_to_display.length > 0 
      ? fields_to_display 
      : Object.keys(data[0]);

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {fields.map((field) => (
              <TableHead key={field}>{field}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record, index) => (
            <TableRow key={record.Id || index}>
              {fields.map((field) => (
                <TableCell key={`${record.Id}-${field}`}>
                  {record[field]?.toString() || ''}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderContent = () => {
    if (!salesforceData) return null;

    switch (chart_type) {
      case 'table':
        return renderTableView(salesforceData);
      default:
        return renderTableView(salesforceData);
    }
  };

  return (
    <div 
      style={{ 
        backgroundColor: tailwindToHex[backgroundColor] || tailwindToHex['bg-white']
      }} 
      className="rounded-lg shadow-lg min-h-[200px]"
    >
      <Card className="widget border-none shadow-none bg-transparent">
        <CardHeader className="bg-transparent">
          <CardTitle className="bg-transparent">{config.title || 'Salesforce Data'}</CardTitle>
        </CardHeader>
        <CardContent className="bg-transparent">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          
          {error && (
            <p className="text-red-500">Error loading data: {error.message}</p>
          )}

          {salesforceData && (
            <>
              {show_totals && (
                <div className="mb-4 text-sm text-gray-600">
                  Total records: {salesforceData.length}
                </div>
              )}
              <div className="overflow-x-auto">
                {renderContent()}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
