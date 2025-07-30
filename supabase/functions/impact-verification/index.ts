import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImpactVerificationPayload {
  projectId: string;
  milestoneId: string;
  validatorId: string;
  photos: string[];
  gpsLocation: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  feedbackComment: string;
  rating: number; // 1-5
  language: string;
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

    const verification: ImpactVerificationPayload = await req.json()

    // Validate required fields
    if (!verification.projectId || !verification.milestoneId || !verification.validatorId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: projectId, milestoneId, validatorId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate GPS coordinates (rough bounds for Africa)
    if (verification.gpsLocation) {
      const { lat, lng } = verification.gpsLocation
      if (lat < -35 || lat > 37 || lng < -18 || lng > 52) {
        return new Response(
          JSON.stringify({ error: 'GPS coordinates appear to be outside Africa' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Validate rating
    if (verification.rating < 1 || verification.rating > 5) {
      return new Response(
        JSON.stringify({ error: 'Rating must be between 1 and 5' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if validator exists and is active
    const { data: validator, error: validatorError } = await supabaseClient
      .from('community_validators')
      .select('*')
      .eq('id', verification.validatorId)
      .eq('status', 'active')
      .single()

    if (validatorError || !validator) {
      return new Response(
        JSON.stringify({ error: 'Validator not found or inactive' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if project and milestone exist
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', verification.projectId)
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

    // Verify photos are accessible (basic validation)
    for (const photoUrl of verification.photos) {
      try {
        const photoResponse = await fetch(photoUrl, { method: 'HEAD' })
        if (!photoResponse.ok) {
          console.warn(`Photo URL not accessible: ${photoUrl}`)
        }
      } catch (error) {
        console.warn(`Error checking photo URL ${photoUrl}:`, error)
      }
    }

    // Insert validation record
    const { data: validationRecord, error: insertError } = await supabaseClient
      .from('milestone_validations')
      .insert({
        project_id: verification.projectId,
        milestone_id: verification.milestoneId,
        validator_id: verification.validatorId,
        validation_photos: verification.photos,
        gps_location: verification.gpsLocation,
        feedback_comment: verification.feedbackComment,
        rating: verification.rating,
        language: verification.language,
        status: 'pending' // Will be approved/rejected by community consensus
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting validation:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to record validation' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update validator stats
    const { error: validatorUpdateError } = await supabaseClient
      .from('community_validators')
      .update({
        validation_count: validator.validation_count + 1
      })
      .eq('id', verification.validatorId)

    if (validatorUpdateError) {
      console.error('Error updating validator stats:', validatorUpdateError)
    }

    // Check if this milestone has enough validations to be approved
    const { data: allValidations, error: validationsError } = await supabaseClient
      .from('milestone_validations')
      .select('*')
      .eq('project_id', verification.projectId)
      .eq('milestone_id', verification.milestoneId)

    if (!validationsError && allValidations) {
      const requiredValidations = 3 // Configurable per project
      const approvedValidations = allValidations.filter(v => v.status === 'approved').length
      const pendingValidations = allValidations.filter(v => v.status === 'pending').length
      
      if (approvedValidations + pendingValidations >= requiredValidations) {
        // Calculate consensus
        const averageRating = allValidations.reduce((sum, v) => sum + v.rating, 0) / allValidations.length
        
        if (averageRating >= 4.0) {
          // Auto-approve milestone and release funds
          await approveMilestoneAndReleaseFunds(
            supabaseClient,
            verification.projectId,
            verification.milestoneId,
            allValidations
          )
        }
      }
    }

    // Send notifications to project stakeholders
    await notifyStakeholders(
      supabaseClient,
      verification.projectId,
      verification.milestoneId,
      validationRecord
    )

    return new Response(
      JSON.stringify({ 
        success: true, 
        validationId: validationRecord.id,
        status: 'pending',
        message: 'Impact verification submitted successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Impact verification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function approveMilestoneAndReleaseFunds(
  supabaseClient: any,
  projectId: string,
  milestoneId: string,
  validations: any[]
) {
  try {
    // Update all pending validations to approved
    await supabaseClient
      .from('milestone_validations')
      .update({ status: 'approved' })
      .eq('project_id', projectId)
      .eq('milestone_id', milestoneId)
      .eq('status', 'pending')

    // In a real implementation, this would:
    // 1. Trigger smart contract to release milestone funds
    // 2. Update project milestone status
    // 3. Send notifications to all stakeholders
    
    console.log(`Milestone ${milestoneId} approved for project ${projectId}`)
    console.log(`Releasing funds based on ${validations.length} community validations`)

    // Update project milestone status (assuming milestones are stored in project.milestones JSONB)
    const { data: project } = await supabaseClient
      .from('projects')
      .select('milestones')
      .eq('id', projectId)
      .single()

    if (project && project.milestones) {
      const updatedMilestones = project.milestones.map((milestone: any) => {
        if (milestone.id === milestoneId) {
          return { ...milestone, status: 'completed', verifiedAt: new Date().toISOString() }
        }
        return milestone
      })

      await supabaseClient
        .from('projects')
        .update({ milestones: updatedMilestones })
        .eq('id', projectId)
    }

  } catch (error) {
    console.error('Error approving milestone:', error)
  }
}

async function notifyStakeholders(
  supabaseClient: any,
  projectId: string,
  milestoneId: string,
  validation: any
) {
  try {
    // Get project details for notification
    const { data: project } = await supabaseClient
      .from('projects')
      .select('title, ngo_address')
      .eq('id', projectId)
      .single()

    if (!project) return

    // In a real implementation, send notifications via:
    // 1. Email to NGO
    // 2. SMS to donors
    // 3. Push notifications to mobile app users
    // 4. Updates to project timeline

    console.log(`Notifying stakeholders about new validation for ${project.title}`)
    console.log(`Validation rating: ${validation.rating}/5`)
    console.log(`Validator feedback: ${validation.feedback_comment}`)

  } catch (error) {
    console.error('Error notifying stakeholders:', error)
  }
}
