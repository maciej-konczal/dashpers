
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://deno.land/x/openai@v4.20.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY')
  });

  try {
    const { content } = await req.json()

    if (!content) {
      throw new Error('Content is required')
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates very concise summaries. Limit your response to 2-4 sentences, focusing only on the most important information. Avoid repetition and unnecessary details."
        },
        {
          role: "user",
          content: `Please provide a brief summary of these widgets: ${content}`
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const summary = completion.choices[0].message.content;

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
