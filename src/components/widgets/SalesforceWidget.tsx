import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WidgetConfig, SalesforceWidgetPreferences } from '@/types/widgets';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format as formatDate } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column {
  field: string;
  label: string;
  format?: 'date';
}

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
    columns = [],
  } = preferences;

  console.log('Using background color:', backgroundColor);

  // Check if the backgroundColor is a hex code (starts with #)
  const isHexColor = backgroundColor.startsWith('#');

  const { data: salesforceData, isLoading, error } = useQuery({
    queryKey: ['salesforce-data', config.id, soql_query],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('salesforce-tasks', {
          body: {
            query: soql_query,
            maxRecords: max_records
          }
        });
        
        if (error) {
          // Check if it's a service limit error (non-2xx status)
          if (error.message?.includes('non-2xx status code')) {
            throw new Error('Service not available. We are using free plans for now.');
          }
          throw error;
        }
        
        return data.records;
      } catch (err) {
        console.error('Salesforce query error:', err);
        throw err;
      }
    }
  });

  const formatValue = (value: any, formatType?: string) => {
    if (value === null || value === undefined) return '';
    
    if (formatType === 'date' && value) {
      try {
        return formatDate(new Date(value), 'MMM dd, yyyy');
      } catch (e) {
        console.error('Error formatting date:', e);
        return value;
      }
    }
    
    return value.toString();
  };

  const renderTableView = (data: any[]) => {
    if (!data || data.length === 0) return <p>No data available</p>;

    // Use columns configuration if available, otherwise fall back to all fields
    const displayColumns: Column[] = columns.length > 0 
      ? columns 
      : Object.keys(data[0]).map(field => ({ field, label: field }));

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {displayColumns.map((column) => (
              <TableHead key={column.field}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record, index) => (
            <TableRow key={record.Id || index}>
              {displayColumns.map((column) => (
                <TableCell key={`${record.Id}-${column.field}`}>
                  {formatValue(record[column.field], column.format)}
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
      style={isHexColor ? { backgroundColor } : undefined}
      className={cn(
        "rounded-lg shadow-lg min-h-[200px]",
        !isHexColor && backgroundColor // Only apply Tailwind class if not hex
      )}
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
            <div className="text-red-500">
              <div>Error: {error instanceof Error ? error.message : 'An error occurred'}</div>
              {error instanceof Error && error.message.includes('Service not available') && (
                <div className="mt-2 text-sm">Do you wanna help us? 😊</div>
              )}
            </div>
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
