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

      console.log('Processing successful payment for project:', metadata.projectId)
      console.log('Payment amount:', session.amount_total)
      console.log('Customer email:', session.customer_details?.email)

      // Update transaction status in Supabase
      const { error: updateError } = await supabaseClient
        .from('donation_transactions')
        .update({
          status: 'completed',
          tx_hash: `stripe_${session.payment_intent}`,
          donor_address: session.customer_details?.email || 'anonymous',
        })
        .eq('stripe_payment_intent_id', session.id)

      if (updateError) {
        console.error('Error updating transaction:', updateError)
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

      // Update impact metrics
      await updateImpactMetrics(supabaseClient, metadata.projectId, donationAmount, session.currency || 'usd')

      // Send confirmation email/SMS (if configured)
      if (session.customer_details?.email) {
        await sendDonationConfirmation(
          session.customer_details.email,
          donationAmount,
          metadata.projectId,
          session.id
        )
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
      console.log(`Amount: $${donationAmount} | Session: ${session.id}`)
    }

    // Handle payment failures
    if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      const session = event.data.object as any
      const sessionId = session.id || session.charges?.data?.[0]?.payment_intent

      if (sessionId) {
        await supabaseClient
          .from('donation_transactions')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', sessionId)
      }
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

async function updateImpactMetrics(
  supabaseClient: any,
  projectId: string,
  amount: number,
  currency: string
) {
  try {
    // Get project details
    const { data: project } = await supabaseClient
      .from('projects')
      .select('category, region_id')
      .eq('id', projectId)
      .single()

    if (!project) return

    // Get current metrics
    const { data: metrics } = await supabaseClient
      .from('african_impact_metrics')
      .select('*')
      .single()

    if (metrics) {
      const updates: any = {}
      
      // Update category-specific metrics
      switch (project.category) {
        case 'water':
          updates.water_access_improved = (metrics.water_access_improved || 0) + Math.floor(amount * 2)
          break
        case 'education':
          updates.schools_built = (metrics.schools_built || 0) + (amount > 1000 ? 1 : 0)
          break
        case 'health':
          updates.health_clinics_supported = (metrics.health_clinics_supported || 0) + (amount > 5000 ? 1 : 0)
          break
        case 'agriculture':
          updates.jobs_created = (metrics.jobs_created || 0) + Math.floor(amount / 100)
          break
        case 'infrastructure':
          updates.communities_reached = (metrics.communities_reached || 0) + Math.floor(amount / 500)
          break
      }

      // Update currency impact
      const currencyImpact = metrics.local_currency_impact || {}
      currencyImpact[currency.toUpperCase()] = (currencyImpact[currency.toUpperCase()] || 0) + amount
      updates.local_currency_impact = currencyImpact

      // Update projects by category
      const projectsByCategory = metrics.projects_by_category || {}
      projectsByCategory[project.category] = (projectsByCategory[project.category] || 0) + 1
      updates.projects_by_category = projectsByCategory

      await supabaseClient
        .from('african_impact_metrics')
        .update(updates)
        .eq('id', metrics.id)
    }
  } catch (error) {
    console.error('Error updating impact metrics:', error)
  }
}

async function sendDonationConfirmation(
  email: string,
  amount: number,
  projectId: string,
  sessionId: string
) {
  try {
    // In a real implementation, you would send an email via:
    // - SendGrid
    // - Mailgun  
    // - AWS SES
    // - Or Supabase Edge Function for email
    
    console.log(`Sending confirmation email to ${email}`)
    console.log(`Donation: $${amount} to project ${projectId}`)
    console.log(`Session: ${sessionId}`)
    
    // TODO: Implement actual email sending
  } catch (error) {
    console.error('Error sending confirmation email:', error)
  }
}