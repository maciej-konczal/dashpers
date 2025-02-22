
import React, { useState, useEffect } from 'react';
import { WidgetRegistry } from './widgets/WidgetRegistry';
import { WidgetConfig } from '@/types/widgets';
import { supabase } from '@/lib/supabase';

export const Dashboard: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);

  // Fetch widgets from Supabase on component mount
  useEffect(() => {
    const fetchWidgets = async () => {
      const { data, error } = await supabase
        .from('widgets')
        .select('*');
      
      if (!error && data) {
        setWidgets(data);
      }
    };

    fetchWidgets();
  }, []);

  return (
    <div className="dashboard-grid">
      {widgets.map(widget => (
        <WidgetRegistry key={widget.id} config={widget} />
      ))}
    </div>
  );
};
