
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WidgetConfig } from '@/types/widgets';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface PicaWidgetProps {
  config: WidgetConfig;
}

export const PicaWidget: React.FC<PicaWidgetProps> = ({ config }) => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPicaResult = async () => {
    try {
      setLoading(true);
      setError(null);

      const { prompt, tool, maxSteps = 5 } = config.preferences;

      // Format the messages array properly
      const messages = [{
        role: 'user',
        content: prompt
      }];

      const { data, error: picaError } = await supabase.functions.invoke('pica-agent', {
        body: { 
          messages,
          tool,
          maxSteps
        }
      });

      if (picaError) throw picaError;

      // Handle both response formats (data.text or data.response)
      setResult(data.response || data.text);
    } catch (err) {
      console.error('Error fetching Pica result:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPicaResult();

    // Set up refresh interval if specified
    if (config.preferences.refreshInterval) {
      const interval = setInterval(fetchPicaResult, config.preferences.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [config.preferences.prompt, config.preferences.tool]);

  return (
    <Card 
      className="widget" 
      style={
        config.preferences.backgroundColor?.startsWith('#') 
          ? { backgroundColor: config.preferences.backgroundColor }
          : undefined
      }
    >
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-500">
            Error: {error}
          </div>
        ) : (
          <div className="prose">
            <pre className="whitespace-pre-wrap">
              {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
