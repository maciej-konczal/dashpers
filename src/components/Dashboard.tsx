
import React, { useState, useEffect } from 'react';
import { WidgetRegistry } from './widgets/WidgetRegistry';
import { WidgetConfig, WidgetType, WidgetPreferences, WidgetData } from '@/types/widgets';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Button } from './ui/button';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardProps {
  onEditWidget: (widgetId: string) => void;
  editingWidgetId?: string | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ onEditWidget, editingWidgetId }) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  useEffect(() => {
    // Fetch initial widgets
    const fetchWidgets = async () => {
      const { data, error } = await supabase
        .from('widgets')
        .select('*');
      
      if (!error && data) {
        setWidgets(data as WidgetConfig[]);
      }
    };

    fetchWidgets();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'widgets'
        },
        (payload: RealtimePostgresChangesPayload<WidgetData>) => {
          console.log('New widget inserted:', payload);
          if (payload.new && isWidgetData(payload.new)) {
            const newWidget: WidgetConfig = {
              id: payload.new.id,
              type: payload.new.type,
              title: payload.new.title,
              preferences: payload.new.preferences,
              content: payload.new.content
            };
            setWidgets(currentWidgets => [...currentWidgets, newWidget]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'widgets'
        },
        (payload: RealtimePostgresChangesPayload<{ id: string }>) => {
          console.log('Widget deleted:', payload);
          const oldRecord = payload.old;
          if (hasValidId(oldRecord)) {
            setWidgets(currentWidgets => 
              currentWidgets.filter(widget => widget.id !== oldRecord.id)
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'widgets'
        },
        (payload: RealtimePostgresChangesPayload<WidgetData>) => {
          console.log('Widget updated:', payload);
          if (payload.new && isWidgetData(payload.new)) {
            const updatedWidget: WidgetConfig = {
              id: payload.new.id,
              type: payload.new.type,
              title: payload.new.title,
              preferences: payload.new.preferences,
              content: payload.new.content
            };
            setWidgets(currentWidgets =>
              currentWidgets.map(widget =>
                widget.id === updatedWidget.id ? updatedWidget : widget
              )
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-4">
      {editingWidgetId && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg mx-4">
          Editing widget. Type your changes in the chat panel.
        </div>
      )}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map(widget => (
          <div 
            key={widget.id} 
            className={`relative group ${
              editingWidgetId === widget.id 
                ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' 
                : ''
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={() => onEditWidget(widget.id)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <WidgetRegistry config={widget} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to type-check if an object is a WidgetData
function isWidgetData(data: any): data is WidgetData {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.type === 'string' &&
    typeof data.title === 'string' &&
    typeof data.preferences === 'object'
  );
}

// Helper function to check if an object has an id property of type string
function hasValidId(data: Record<string, any> | null): data is { id: string } {
  return Boolean(data && typeof data.id === 'string');
}
