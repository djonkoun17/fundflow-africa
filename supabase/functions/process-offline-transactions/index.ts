import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { transactions } = await req.json()

    if (!transactions || !Array.isArray(transactions)) {
      return new Response(
        JSON.stringify({ error: 'Invalid transactions data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const processedTransactions = []
    const failedTransactions = []

    for (const transaction of transactions) {
      try {
        // Insert transaction into database
        const { data, error } = await supabaseClient
          .from('donation_transactions')
          .insert({
            project_id: transaction.projectId,
            milestone_id: transaction.milestoneId,
            amount: transaction.amount,
            currency: transaction.currency,
            payment_method: transaction.paymentMethod,
            status: 'processing', // Will be updated after payment processing
            offline: false, // Now being processed online
            mobile_money_provider: transaction.mobileMoneyProvider,
          })
          .select()
          .single()

        if (error) {
          throw error
        }

        // TODO: Process payment through Stripe
        // For offline transactions, you might want to:
        // 1. Create a payment intent
        // 2. Send SMS/email to user for payment completion
        // 3. Or process if payment details were stored securely

        // TODO: BLOCKCHAIN INTEGRATION POINT
        // After successful payment, integrate with blockchain
        /*
        const blockchainResult = await processBlockchainDonation({
          projectId: transaction.projectId,
          amount: transaction.amount,
          paymentMethod: transaction.paymentMethod,
        })
        
        await supabaseClient
          .from('donation_transactions')
          .update({
            status: 'completed',
            tx_hash: blockchainResult.transactionHash,
          })
          .eq('id', data.id)
        */

        processedTransactions.push({
          originalId: transaction.id,
          newId: data.id,
          status: 'processed'
        })

      } catch (error) {
        console.error('Error processing offline transaction:', error)
        failedTransactions.push({
          originalId: transaction.id,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedTransactions.length,
        failed: failedTransactions.length,
        processedTransactions,
        failedTransactions
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing offline transactions:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})