import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSPayload {
  to: string;
  message: string;
  country: string; // e.g., 'KE', 'NG', 'GH'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, message, country }: SMSPayload = await req.json()

    if (!to || !message || !country) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message, country' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const smsProviderApi = Deno.env.get('SMS_PROVIDER_API')
    const smsProviderAuth = Deno.env.get('SMS_PROVIDER_AUTH_TOKEN')

    if (!smsProviderApi || !smsProviderAuth) {
      console.error('SMS provider environment variables not set')
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // In a real-world scenario, you would choose the provider based on the country.
    // For this hackathon, we'll use a single provider API endpoint.
    console.log(`Sending SMS to ${to} in ${country}: "${message}"`);

    const response = await fetch(smsProviderApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${smsProviderAuth}`
      },
      body: JSON.stringify({ to, message })
    });

    if (!response.ok) {
      throw new Error(`SMS provider responded with status ${response.status}`);
    }

    const responseData = await response.json();

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending SMS:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
