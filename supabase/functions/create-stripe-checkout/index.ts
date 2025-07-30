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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const { 
      amount, 
      currency, 
      projectId, 
      milestoneId, 
      paymentMethod, 
      mobileMoneyProvider, 
      donorEmail 
    } = await req.json()

    // Validate input
    if (!amount || !currency || !projectId || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get project details from Supabase
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Donation to: ${project.title}`,
              description: `Supporting ${project.title} in ${project.region_id} - ${mobileMoneyProvider || 'Card Payment'}`,
              images: project.images?.length > 0 ? [project.images[0]] : [],
              metadata: {
                projectId,
                category: project.category,
                region: project.region_id,
              },
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/cancel`,
      automatic_tax: { enabled: false },
      customer_email: donorEmail,
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['KE', 'NG', 'GH', 'ZA', 'UG', 'TZ', 'RW', 'SN', 'CI', 'MA'],
      },
      metadata: {
        projectId,
        milestoneId: milestoneId || '',
        paymentMethod,
        mobileMoneyProvider: mobileMoneyProvider || '',
        blockchainIntegration: 'pending', // Flag for blockchain processing
        africanDonation: 'true',
        platform: 'fundflow-africa',
      },
      locale: 'auto',
      allow_promotion_codes: true,
    })

    // Record the payment intent in Supabase
    const { error: insertError } = await supabaseClient
      .from('donation_transactions')
      .insert({
        project_id: projectId,
        milestone_id: milestoneId,
        amount: amount,
        currency: currency,
        payment_method: paymentMethod,
        status: 'pending',
        donor_address: donorEmail || 'anonymous',
        offline: false,
        stripe_payment_intent_id: session.id,
        mobile_money_provider: mobileMoneyProvider,
      })

    if (insertError) {
      console.error('Error recording transaction:', insertError)
      // Don't fail the checkout creation, just log the error
    }

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        paymentIntentId: session.payment_intent,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})