
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SalesforceAuth {
  access_token: string;
  instance_url: string;
}

async function getSalesforceAuth(): Promise<SalesforceAuth> {
  const clientId = Deno.env.get('SALESFORCE_CLIENT_ID');
  const clientSecret = Deno.env.get('SALESFORCE_CLIENT_SECRET');
  const username = Deno.env.get('SALESFORCE_USERNAME');
  const password = Deno.env.get('SALESFORCE_PASSWORD');

  console.log('Attempting Salesforce authentication with provided credentials...');

  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId!,
    client_secret: clientSecret!,
    username: username!,
    password: password!,
  });

  try {
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Salesforce authentication failed:', errorData);
      throw new Error(`Failed to authenticate with Salesforce: ${errorData}`);
    }

    const data = await response.json();
    console.log('Successfully authenticated with Salesforce');
    return data;
  } catch (error) {
    console.error('Error during Salesforce authentication:', error);
    throw error;
  }
}

async function fetchTasks(auth: SalesforceAuth) {
  console.log('Fetching tasks from Salesforce...');
  try {
    const response = await fetch(`${auth.instance_url}/services/data/v57.0/query/?q=${encodeURIComponent(
      'SELECT Id, Subject, Status, ActivityDate FROM Task ORDER BY ActivityDate DESC LIMIT 10'
    )}`, {
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to fetch tasks:', errorData);
      throw new Error(`Failed to fetch tasks from Salesforce: ${errorData}`);
    }

    const data = await response.json();
    console.log('Successfully fetched tasks from Salesforce');
    return data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Salesforce tasks function...');
    const auth = await getSalesforceAuth();
    
    console.log('Fetching tasks...');
    const tasks = await fetchTasks(auth);
    
    return new Response(JSON.stringify(tasks), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in salesforce-tasks function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
