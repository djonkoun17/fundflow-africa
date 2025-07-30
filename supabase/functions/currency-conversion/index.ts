import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConversionRequest {
  from: string; // Source currency (e.g., 'KES', 'NGN', 'GHS')
  to: string;   // Target currency (e.g., 'USD', 'ETH')
  amount: number;
}

interface ConversionResponse {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  timestamp: string;
}

// African currency exchange rates (mock data for hackathon)
const AFRICAN_CURRENCY_RATES = {
  'KES': { 'USD': 0.0062, 'ETH': 0.0000028 }, // Kenyan Shilling
  'NGN': { 'USD': 0.0012, 'ETH': 0.0000005 }, // Nigerian Naira
  'GHS': { 'USD': 0.065,  'ETH': 0.000029  }, // Ghanaian Cedi
  'ZAR': { 'USD': 0.053,  'ETH': 0.000024  }, // South African Rand
  'UGX': { 'USD': 0.00027,'ETH': 0.00000012}, // Ugandan Shilling
  'TZS': { 'USD': 0.00043,'ETH': 0.00000019}, // Tanzanian Shilling
  'XOF': { 'USD': 0.0016, 'ETH': 0.0000007 }, // West African CFA Franc
  'MAD': { 'USD': 0.097,  'ETH': 0.000044  }, // Moroccan Dirham
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { from, to, amount }: ConversionRequest = await req.json()

    if (!from || !to || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid required fields: from, to, amount' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let conversionRate: number
    let convertedAmount: number

    // Check if we have local rates for African currencies
    if (AFRICAN_CURRENCY_RATES[from] && AFRICAN_CURRENCY_RATES[from][to]) {
      conversionRate = AFRICAN_CURRENCY_RATES[from][to]
      convertedAmount = amount * conversionRate
    } else {
      // Fallback to external API for other currencies
      const externalRate = await getExternalExchangeRate(from, to)
      if (!externalRate) {
        return new Response(
          JSON.stringify({ error: `Conversion rate not available for ${from} to ${to}` }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      conversionRate = externalRate
      convertedAmount = amount * conversionRate
    }

    const response: ConversionResponse = {
      from,
      to,
      amount,
      convertedAmount: Math.round(convertedAmount * 1000000) / 1000000, // Round to 6 decimal places
      rate: conversionRate,
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Currency conversion error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function getExternalExchangeRate(from: string, to: string): Promise<number | null> {
  try {
    const apiKey = Deno.env.get('AFRICAN_CURRENCIES_API')
    
    if (!apiKey) {
      console.log('External currency API not configured')
      return null
    }

    // In a real implementation, you would use APIs like:
    // - ExchangeRate-API
    // - Fixer.io
    // - CurrencyAPI
    // - African-specific APIs like Flutterwave Rates
    
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}?access_key=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`External API responded with status ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.rates && data.rates[to]) {
      return data.rates[to]
    }
    
    return null
    
  } catch (error) {
    console.error('Error fetching external exchange rate:', error)
    return null
  }
}
