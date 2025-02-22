
import React, { useState, useEffect } from 'react';
import { WidgetRegistry } from './widgets/WidgetRegistry';
import { WidgetConfig } from '@/types/widgets';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface WidgetData {
  id: string;
  type: string;
  title: string;
  preferences: {
    color?: string;
    emojis?: boolean;
  };
}

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
function hasValidId(data: any): data is { id: string } {
  return data && typeof data.id === 'string';
}

export const Dashboard: React.FC = () => {
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
              preferences: payload.new.preferences || {}
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
        (payload: RealtimePostgresChangesPayload<WidgetData>) => {
          console.log('Widget deleted:', payload);
          if (payload.old && hasValidId(payload.old)) {
            setWidgets(currentWidgets => 
              currentWidgets.filter(widget => widget.id !== payload.old.id)
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
              preferences: payload.new.preferences || {}
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
    <div className="dashboard-grid">
      {widgets.map(widget => (
        <WidgetRegistry key={widget.id} config={widget} />
      ))}
    </div>
  );
};
