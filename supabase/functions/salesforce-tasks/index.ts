
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

interface RequestBody {
  query?: string;
  maxRecords?: number;
  objectType?: string;
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

async function getCurrentUserId(auth: SalesforceAuth): Promise<string> {
  try {
    const response = await fetch(`${auth.instance_url}/services/data/v57.0/chatter/users/me`, {
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get current user info');
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    throw error;
  }
}

async function executeSalesforceQuery(auth: SalesforceAuth, query: string) {
  console.log('Executing Salesforce query:', query);
  try {
    const response = await fetch(`${auth.instance_url}/services/data/v57.0/query/?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to execute query:', errorData);
      throw new Error(`Failed to execute Salesforce query: ${errorData}`);
    }

    const data = await response.json();
    console.log('Successfully executed Salesforce query');
    return data;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Salesforce query function...');
    const auth = await getSalesforceAuth();
    const userId = await getCurrentUserId(auth);
    
    // Get request body
    let body: RequestBody = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (e) {
        console.warn('No body or invalid JSON in request');
      }
    }

    // Use provided query or fallback to default
    const maxRecords = body.maxRecords || 10;
    const query = `SELECT Id, Subject, Status, ActivityDate FROM Task WHERE OwnerId = '${userId}' ORDER BY ActivityDate DESC LIMIT ${maxRecords}`;
    
    console.log('Executing query:', query);
    const data = await executeSalesforceQuery(auth, query);
    
    return new Response(JSON.stringify(data), {
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
