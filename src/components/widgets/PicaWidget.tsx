
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

      if (picaError) {
        // Check if it's a service limit error (non-2xx status)
        if (picaError.message?.includes('non-2xx status code')) {
          throw new Error('Service not available. We are using free plans for now.');
        }
        throw picaError;
      }

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

  return (
    <Card 
      className="widget" 
      style={{ backgroundColor: config.preferences.backgroundColor || '#ffffff' }}
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
            <div>Error: {error}</div>
            {error.includes('Service not available') && (
              <div className="mt-2 text-sm">Do you wanna help us? 😊</div>
            )}
          </div>
        ) : (
          <div className="prose">
            {typeof result === 'string' ? (
              <div className="whitespace-pre-wrap">
                {formatText(result)}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
