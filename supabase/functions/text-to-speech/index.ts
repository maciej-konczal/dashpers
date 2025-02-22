
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Function invoked, parsing request body...');
    const { text } = await req.json()
    
    console.log('Received text:', text?.substring(0, 100) + '...');
    
    if (!text) {
      console.error('No text provided in request');
      throw new Error('Text is required')
    }

    // Using George's voice ID by default
    const voiceId = 'JBFqnCBsd6RMkjVDRZzb';
    console.log('Using voice ID:', voiceId);

    const apiKey = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!apiKey) {
      console.error('ElevenLabs API key not found in environment variables');
      throw new Error('API key not configured');
    }
    console.log('API key found in environment');

    console.log('Making request to ElevenLabs API...');
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        }
      }),
    });

    console.log('ElevenLabs response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs API error response:', errorData);
      throw new Error('Failed to generate speech: ' + errorData);
    }

    console.log('Successfully received audio response, processing...');
    const arrayBuffer = await response.arrayBuffer();
    console.log('Audio size:', arrayBuffer.byteLength, 'bytes');

    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );
    console.log('Successfully converted audio to base64');

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Text-to-speech error:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
