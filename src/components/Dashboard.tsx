
import React, { useState } from 'react';
import { SampleWidget } from './widgets/SampleWidget';

interface Widget {
  id: string;
  type: string;
  data?: any;
}

export const Dashboard: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);

  const addWidget = (type: string, data?: any) => {
    setWidgets(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data
    }]);
  };

  return (
    <div className="dashboard-grid">
      {widgets.map(widget => (
        <SampleWidget key={widget.id} data={widget.data} />
      ))}
    </div>
  );
};
