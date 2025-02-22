
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to create a concise summary
function preprocessText(text: string): string {
  // Split into sentences (accounting for multiple punctuation marks)
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  // Take up to 4 most relevant sentences
  const summary = sentences.slice(0, 4).join(' ');
  
  // Ensure the text isn't too long (max 500 characters)
  return summary.length > 500 ? summary.slice(0, 497) + '...' : summary;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Function invoked, parsing request body...');
    const { text } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    // Preprocess the text to make it more concise
    const processedText = preprocessText(text);
    console.log('Processed text length:', processedText.length);

    const voiceId = 'JBFqnCBsd6RMkjVDRZzb';
    const apiKey = Deno.env.get('ELEVEN_LABS_API_KEY');
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: processedText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error('Failed to generate speech: ' + errorData);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Text-to-speech error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
