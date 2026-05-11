import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apiKey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    
    // LOG EVERYTHING so the user can see the Zoho Verification Code in Supabase Logs
    console.log("INBOUND PAYLOAD:", JSON.stringify(payload, null, 2))
    const fromEmail = payload.from || payload.sender || payload.envelope?.from
    const subject = payload.subject || "No Subject"
    const body = payload.html || payload.text || payload.plain || ""

    if (!fromEmail) {
      return new Response(JSON.stringify({ error: 'Missing sender email' }), { status: 400 })
    }

    // 1. Find the lead by email
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, company_id, contact_name')
      .eq('email', fromEmail)
      .single()

    if (leadError || !lead) {
      console.log(`No lead found for email: ${fromEmail}`)
      return new Response(JSON.stringify({ status: 'ignored', reason: 'No matching lead' }), { status: 200 })
    }

    // 2. Log the inbound activity
    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        lead_id: lead.id,
        title: `Inbound Email: ${subject}`,
        type: 'email_inbound',
        content: body,
        completed: true,
        company_id: lead.company_id
      })

    if (activityError) throw activityError

    // 3. Create the notification for the lead owner
    await supabase.from('notifications').insert({
      title: 'New Email Received',
      message: `You received an email from ${lead.contact_name || fromEmail}: "${subject}"`,
      type: 'email',
      user_id: lead.assigned_to, 
      company_id: lead.company_id,
      link: `/crm/leads/${lead.id}`
    })

    return new Response(JSON.stringify({ status: 'success', leadId: lead.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
