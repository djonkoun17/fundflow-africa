import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

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

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      return new Response('Missing signature or webhook secret', { status: 400 })
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log('Received Stripe webhook:', event.type)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata

      if (!metadata?.projectId) {
        console.error('Missing project ID in metadata')
        return new Response('Missing project ID', { status: 400 })
      }

      // Update transaction status in Supabase
      const { error: updateError } = await supabaseClient
        .from('donation_transactions')
        .update({
          status: 'completed',
          tx_hash: `stripe_${session.id}`, // Temporary until blockchain integration
        })
        .eq('stripe_payment_intent_id', session.id)

      if (updateError) {
        console.error('Error updating transaction:', updateError)
        return new Response('Database update failed', { status: 500 })
      }

      // Update project current amount
      const donationAmount = (session.amount_total || 0) / 100 // Convert from cents

      const { data: project, error: projectError } = await supabaseClient
        .from('projects')
        .select('current_amount')
        .eq('id', metadata.projectId)
        .single()

      if (!projectError && project) {
        const { error: projectUpdateError } = await supabaseClient
          .from('projects')
          .update({
            current_amount: project.current_amount + donationAmount
          })
          .eq('id', metadata.projectId)

        if (projectUpdateError) {
          console.error('Error updating project amount:', projectUpdateError)
        }
      }

      // TODO: BLOCKCHAIN INTEGRATION POINT
      // This is where you would interact with your smart contract
      // Example:
      /*
      try {
        const blockchainResult = await processBlockchainDonation({
          projectId: metadata.projectId,
          amount: donationAmount,
          donorAddress: session.customer_details?.email || 'anonymous',
          paymentMethod: metadata.paymentMethod,
        })
        
        // Update transaction with blockchain hash
        await supabaseClient
          .from('donation_transactions')
          .update({
            tx_hash: blockchainResult.transactionHash,
            donor_address: blockchainResult.donorAddress,
          })
          .eq('stripe_payment_intent_id', session.id)
          
      } catch (blockchainError) {
        console.error('Blockchain integration error:', blockchainError)
        // Handle blockchain failure - maybe retry later
      }
      */

      console.log(`Successfully processed donation for project ${metadata.projectId}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})