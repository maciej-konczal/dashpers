
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { fal } from "npm:@fal-ai/client";
import { generateSystemPrompt, corsHeaders, tryParseJSON, validateSalesforceConfig } from './utils.ts';
import { tools } from './tools.ts';

const FAL_AI_KEY = Deno.env.get('FAL_AI_KEY');

// Configure fal client
fal.config({
  credentials: FAL_AI_KEY,
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentWidget } = await req.json();

    // Format the conversation history
    const conversation = messages.map(({ role, content }: { role: string; content: string }) => {
      if (role === 'system') return content;
      return role === 'user' ? `Human: ${content}` : `Assistant: ${content}`;
    }).join('\n');

    const systemPrompt = generateSystemPrompt(currentWidget);
    const prompt = `${systemPrompt}\n\n${conversation}\n\nHuman: ${messages[messages.length - 1].content}\n\nAssistant:`;

    console.log('Starting fal.ai request with prompt:', prompt);

    // Use fal.ai with Claude 3.5 Sonnet
    const result = await fal.subscribe("fal-ai/any-llm", {
      input: {
        model: "anthropic/claude-3-sonnet",
        prompt: prompt,
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Queue update:', update);
      }
    });

    console.log('Fal.ai Response:', result);

    const assistantResponse = result.data?.output || '';
    
    // Parse the response
    let toolCall = null;
    let finalMessage = assistantResponse;

    // Look for a JSON object in the response
    const functionCallMatch = assistantResponse.match(/\{[\s\S]*\}/);
    if (functionCallMatch) {
      try {
        const parsed = tryParseJSON(functionCallMatch[0]);
        if (parsed.success) {
          toolCall = parsed.data;
          // Remove the JSON from the message
          finalMessage = assistantResponse.replace(functionCallMatch[0], '').trim();
        } else {
          console.error('Failed to parse tool call:', parsed.error);
        }
      } catch (e) {
        console.error('Error extracting tool call:', e);
      }
    }

    // Validate specific configurations
    if (toolCall) {
      const validationResult = validateSalesforceConfig(toolCall);
      if (!validationResult.isValid) {
        return new Response(
          JSON.stringify({
            message: validationResult.error,
            tool: "final_answer"
          }),
          { headers: corsHeaders }
        );
      }
    }

    // Prepare the response
    const response = {
      message: finalMessage,
      ...(toolCall && toolCall.tool && tools[toolCall.tool] ? {
        tool: toolCall.tool,
        widgetConfig: toolCall.parameters
      } : {
        tool: "final_answer"
      })
    };

    return new Response(
      JSON.stringify(response),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        tool: "final_answer",
        message: "Sorry, I encountered an error processing your request."
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
