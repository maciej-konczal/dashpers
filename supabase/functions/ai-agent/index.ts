
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, generateSystemPrompt, tryParseJSON, validateSalesforceConfig } from './utils.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentWidget } = await req.json();

    console.log('Received request with messages:', messages);
    console.log('Current widget context:', currentWidget);
    
    const systemPrompt = generateSystemPrompt(currentWidget);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to get AI response');
    }

    const aiResponse = await response.json();
    console.log('AI Response:', aiResponse);
    
    const parsed = tryParseJSON(aiResponse.choices[0].message.content);
    if (!parsed.success) {
      console.error('Failed to parse AI response:', parsed.error);
      return new Response(JSON.stringify({
        error: 'Invalid AI response format',
        details: parsed.error
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const toolCall = parsed.data;
    console.log('Tool Call:', toolCall);

    // Ensure title is preserved for widget updates
    if (toolCall.tool === 'update_widget' && currentWidget && !toolCall.parameters.title) {
      toolCall.parameters.title = currentWidget.title;
    }

    // Validate Salesforce widget configurations
    const validation = validateSalesforceConfig(toolCall);
    if (!validation.isValid) {
      return new Response(JSON.stringify({
        error: 'Invalid Salesforce widget configuration',
        details: validation.error
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      message: aiResponse.choices[0].message.content,
      tool: toolCall.tool,
      widgetConfig: toolCall.parameters
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in AI agent:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
