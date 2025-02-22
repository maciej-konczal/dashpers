
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WidgetConfig, SalesforceWidgetPreferences } from '@/types/widgets';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface SalesforceTasksWidgetProps {
  config: WidgetConfig;
}

export const SalesforceTasksWidget: React.FC<SalesforceTasksWidgetProps> = ({ config }) => {
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['salesforce-tasks', config.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('salesforce-tasks');
      if (error) throw error;
      return data.records;
    }
  });

  const preferences = config.preferences as SalesforceWidgetPreferences;
  const bgColor = preferences.backgroundColor || 'bg-white';
  
  return (
    <Card className={`widget ${bgColor} border-none`}>
      <CardHeader>
        <CardTitle>{config.title || 'Salesforce Tasks'}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        
        {error && (
          <p className="text-red-500">Error loading tasks: {error.message}</p>
        )}

        {tasks && (
          <div className="space-y-4">
            {tasks.map((task: any) => (
              <div key={task.Id} className="bg-white/50 p-3 rounded-lg">
                <h3 className="font-medium">{task.Subject}</h3>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Status: {task.Status}</span>
                  {task.ActivityDate && (
                    <span>Due: {new Date(task.ActivityDate).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
