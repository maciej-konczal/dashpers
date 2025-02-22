
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

type WidgetPayload = RealtimePostgresChangesPayload<WidgetData>;

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
        (payload: WidgetPayload) => {
          console.log('New widget inserted:', payload);
          if (payload.new) {
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
        (payload: WidgetPayload) => {
          console.log('Widget deleted:', payload);
          if (payload.old?.id) {
            setWidgets(currentWidgets => 
              currentWidgets.filter(widget => widget.id !== payload.old!.id)
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
        (payload: WidgetPayload) => {
          console.log('Widget updated:', payload);
          if (payload.new) {
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
