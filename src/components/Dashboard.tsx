
import React, { useState, useEffect } from 'react';
import { WidgetRegistry } from './widgets/WidgetRegistry';
import { WidgetConfig } from '@/types/widgets';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const Dashboard: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  useEffect(() => {
    // Fetch initial widgets
    const fetchWidgets = async () => {
      const { data, error } = await supabase
        .from('widgets')
        .select('*');
      
      if (!error && data) {
        setWidgets(data);
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
        (payload: RealtimePostgresChangesPayload<WidgetConfig>) => {
          console.log('New widget inserted:', payload);
          setWidgets(currentWidgets => [...currentWidgets, payload.new]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'widgets'
        },
        (payload: RealtimePostgresChangesPayload<WidgetConfig>) => {
          console.log('Widget deleted:', payload);
          setWidgets(currentWidgets => 
            currentWidgets.filter(widget => widget.id !== payload.old.id)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'widgets'
        },
        (payload: RealtimePostgresChangesPayload<WidgetConfig>) => {
          console.log('Widget updated:', payload);
          setWidgets(currentWidgets =>
            currentWidgets.map(widget =>
              widget.id === payload.new.id ? payload.new : widget
            )
          );
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
