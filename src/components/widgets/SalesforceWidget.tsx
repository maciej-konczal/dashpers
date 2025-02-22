
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
    <Card className={`${backgroundColor}!important widget border-none`}>
      <CardHeader>
        <CardTitle>{config.title || 'Salesforce Data'}</CardTitle>
      </CardHeader>
      <CardContent>
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
  );
};
