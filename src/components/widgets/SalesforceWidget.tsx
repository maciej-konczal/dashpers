
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
    backgroundColor = '#ffffff',
    soql_query,
    show_totals = false,
    chart_type = 'table',
    max_records = 10,
    columns = [],
  } = preferences;

  const formatText = (text: string) => {
    // Regular expression to match URLs wrapped in square brackets with text
    const linkRegex = /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
    
    // Split the text by links and create an array of text and link elements
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add the text before the link
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add the link
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {match[1]}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

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
    
    const stringValue = value.toString();
    // Check if the value contains a markdown-style link
    if (stringValue.includes('[') && stringValue.includes('](')) {
      return formatText(stringValue);
    }
    
    return stringValue;
  };

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

  const renderTableView = (data: any[]) => {
    if (!data || data.length === 0) return <p>No data available</p>;

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
      style={{ backgroundColor }}
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
