
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { fal } from "npm:@fal-ai/client";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const FAL_AI_KEY = Deno.env.get('FAL_AI_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Configure fal client
fal.config({
  credentials: FAL_AI_KEY,
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are a helpful dashboard assistant that helps users create and manage widgets. 
When a user asks to create a widget, first determine the appropriate widget type and then respond with a JSON object that matches the type's configuration structure.

Available widget types and their main use cases:
- salesforce: For displaying Salesforce data with SOQL queries
- slack: For displaying Slack messages and notifications
- news: For displaying news feeds from various sources
- weather: For displaying weather information and forecasts
- calendar: For displaying calendar events and schedules
- chart: For data visualization
- sample: For basic demo widgets

For example, if someone asks for a Salesforce widget to show accounts:
{
  "type": "salesforce",
  "title": "Active Accounts",
  "preferences": {
    "soql_query": "SELECT Id, Name, Industry FROM Account WHERE IsActive = true",
    "object_type": "Account",
    "chart_type": "table",
    "show_totals": true,
    "max_records": 10,
    "backgroundColor": "bg-white",
    "refreshInterval": 300
  }
}

Or for a weather widget:
{
  "type": "weather",
  "title": "Local Weather",
  "preferences": {
    "location": "New York",
    "units": "celsius",
    "show_forecast_days": 5,
    "show_hourly": true,
    "backgroundColor": "bg-blue-50"
  }
}

Ensure each response includes appropriate type-specific preferences as defined in the widget_type_configs table.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Format the conversation
    const conversation = messages.map(({ role, content }: { role: string; content: string }) => {
      if (role === 'system') return content;
      return role === 'user' ? `Human: ${content}` : `Assistant: ${content}`;
    }).join('\n');

    const prompt = `${systemPrompt}\n\n${conversation}\n\nHuman: ${messages[messages.length - 1].content}\n\nAssistant:`;

    console.log('Starting fal.ai request with prompt:', prompt);

    // Use fal.ai client with subscribe method
    const result = await fal.subscribe("fal-ai/any-llm", {
      input: {
        model: "anthropic/claude-3.5-sonnet",
        prompt: prompt,
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Queue update:', update);
      }
    });

    console.log('Fal.ai Response:', result);

    const assistantResponse = result.data?.output || '';
    
    let widgetConfig = null;
    let finalMessage = assistantResponse;

    // Check for function calls in the response
    const functionCallMatch = assistantResponse.match(/\{[\s\S]*\}/);
    if (functionCallMatch) {
      try {
        const functionCallData = JSON.parse(functionCallMatch[0]);
        if (functionCallData.type && functionCallData.title) {
          // Fetch the widget type config to validate preferences
          const { data: typeConfig } = await supabase
            .from('widget_type_configs')
            .select('*')
            .eq('type', functionCallData.type)
            .single();

          if (typeConfig) {
            // Merge default preferences with user-specified ones
            const defaultPrefs = typeConfig.available_preferences;
            widgetConfig = {
              ...functionCallData,
              preferences: {
                ...defaultPrefs,
                ...functionCallData.preferences
              }
            };
            // Remove the function call JSON from the message
            finalMessage = assistantResponse.replace(functionCallMatch[0], '').trim();
          }
        }
      } catch (e) {
        console.error('Error parsing function call:', e);
      }
    }

    return new Response(
      JSON.stringify({
        message: finalMessage,
        widgetConfig
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
