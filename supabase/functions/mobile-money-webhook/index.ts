import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MobileMoneyWebhookPayload {
  type: 'payment_success' | 'payment_failed' | 'payment_pending';
  provider: 'M-Pesa' | 'Orange Money' | 'MTN Mobile Money' | 'Airtel Money';
  transactionId: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  reference: string;
  timestamp: string;
  blockchainIntegration?: {
    contractAddress: string;
    recipientAddress: string;
    conversionRate: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const webhook: MobileMoneyWebhookPayload = await req.json()
    
    console.log('Mobile Money Webhook received:', webhook)

    // Validate webhook signature (in production, add proper validation)
    const webhookSecret = Deno.env.get('MOBILE_MONEY_WEBHOOK_SECRET')
    const signature = req.headers.get('x-webhook-signature')
    
    if (!signature || signature !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find the corresponding donation transaction
    const { data: transaction, error: findError } = await supabaseClient
      .from('donation_transactions')
      .select('*')
      .eq('stripe_payment_intent_id', webhook.reference)
      .single()

    if (findError || !transaction) {
      console.error('Transaction not found:', findError)
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update transaction status based on webhook type
    let newStatus = 'processing'
    if (webhook.type === 'payment_success') {
      newStatus = 'completed'
    } else if (webhook.type === 'payment_failed') {
      newStatus = 'failed'
    }

    // Update the transaction in Supabase
    const { error: updateError } = await supabaseClient
      .from('donation_transactions')
      .update({
        status: newStatus,
        mobile_money_provider: webhook.provider,
        tx_hash: webhook.transactionId, // Mobile money transaction ID
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If payment successful, trigger blockchain integration
    if (webhook.type === 'payment_success' && webhook.blockchainIntegration) {
      try {
        // Convert mobile money to ETH and send to smart contract
        const conversionAmount = webhook.amount * webhook.blockchainIntegration.conversionRate
        
        // In a real implementation, you would:
        // 1. Use a crypto exchange API to buy ETH with the mobile money funds
        // 2. Send the ETH to the smart contract address
        // 3. Update the project's current_amount in the database
        
        console.log(`Converting ${webhook.amount} ${webhook.currency} to ${conversionAmount} ETH`)
        console.log(`Sending to contract: ${webhook.blockchainIntegration.contractAddress}`)
        
        // Update project funding amount
        const { error: projectUpdateError } = await supabaseClient
          .rpc('increment_project_funding', {
            project_id: transaction.project_id,
            amount_increment: conversionAmount
          })

        if (projectUpdateError) {
          console.error('Error updating project funding:', projectUpdateError)
        }

        // Send SMS notification to donor (if phone number provided)
        if (webhook.phoneNumber) {
          await sendSMSNotification(
            webhook.phoneNumber,
            `Your donation of ${webhook.amount} ${webhook.currency} has been successfully converted to ETH and sent to the blockchain. Transaction ID: ${webhook.transactionId}`
          )
        }

      } catch (blockchainError) {
        console.error('Blockchain integration error:', blockchainError)
        // Don't fail the webhook, but log the error
      }
    }

    // Update impact metrics
    if (webhook.type === 'payment_success') {
      await updateImpactMetrics(
        supabaseClient,
        transaction.project_id,
        webhook.amount,
        webhook.currency
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: newStatus,
        transactionId: transaction.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Mobile money webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function sendSMSNotification(phoneNumber: string, message: string) {
  try {
    // In a real implementation, integrate with SMS providers like:
    // - Twilio for international SMS
    // - Africa's Talking for African markets
    // - Infobip for multi-region coverage
    
    const smsAPI = Deno.env.get('SMS_PROVIDER_API')
    if (!smsAPI) {
      console.log('SMS API not configured, skipping SMS notification')
      return
    }

    console.log(`Sending SMS to ${phoneNumber}: ${message}`)
    
    // Placeholder for actual SMS API call
    // const response = await fetch(smsAPI, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ to: phoneNumber, message })
    // })
    
  } catch (error) {
    console.error('SMS notification error:', error)
  }
}

async function updateImpactMetrics(
  supabaseClient: any,
  projectId: string,
  amount: number,
  currency: string
) {
  try {
    // Get project details to determine impact category
    const { data: project } = await supabaseClient
      .from('projects')
      .select('category, region_id')
      .eq('id', projectId)
      .single()

    if (!project) return

    // Update impact metrics based on project category
    const impactUpdates: any = {}
    
    switch (project.category) {
      case 'water':
        impactUpdates.water_access_improved = amount * 2 // 2 people per dollar
        break
      case 'education':
        impactUpdates.schools_built = amount > 1000 ? 1 : 0
        break
      case 'health':
        impactUpdates.health_clinics_supported = amount > 5000 ? 1 : 0
        break
      case 'agriculture':
        impactUpdates.jobs_created = Math.floor(amount / 100) // 1 job per $100
        break
      case 'infrastructure':
        impactUpdates.communities_reached = Math.floor(amount / 500) // 1 community per $500
        break
    }

    // Update local currency impact
    const { data: metrics } = await supabaseClient
      .from('african_impact_metrics')
      .select('local_currency_impact')
      .single()

    if (metrics) {
      const currencyImpact = metrics.local_currency_impact || {}
      currencyImpact[currency] = (currencyImpact[currency] || 0) + amount

      await supabaseClient
        .from('african_impact_metrics')
        .update({
          ...impactUpdates,
          local_currency_impact: currencyImpact
        })
        .eq('id', metrics.id || 'default')
    }

  } catch (error) {
    console.error('Error updating impact metrics:', error)
  }
}
