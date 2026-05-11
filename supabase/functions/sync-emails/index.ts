import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ImapFlow } from "https://esm.sh/imapflow"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apiKey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    let { companyId, leadId } = payload
    
    // 1. Get credentials
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (!company?.smtp_user || !company?.smtp_pass) {
      throw new Error('Email credentials missing in settings.')
    }

    // 2. Get Lead info
    const { data: lead } = await supabase
      .from('leads')
      .select('email, contact_name, assigned_to')
      .eq('id', leadId)
      .single()

    if (!lead?.email) throw new Error('Lead email not found.')

    console.log(`Attempting REAL IMAP connection for ${company.smtp_user} to fetch mail from ${lead.email}`)

    // 3. Connect to REAL Zoho IMAP
    const client = new ImapFlow({
      host: company.imap_host || 'imap.zoho.in',
      port: 993,
      secure: true,
      auth: {
        user: company.smtp_user,
        pass: company.smtp_pass
      },
      logger: false
    })

    await client.connect()
    
    let lock = await client.getMailboxLock('INBOX')
    let count = 0
    
    try {
      // Search for emails FROM the lead
      const messages = await client.search({ from: lead.email })
      
      for (const uid of messages) {
        const email = await client.fetchOne(uid, { source: true, envelope: true, bodyStructure: true })
        const subject = email.envelope.subject || "No Subject"
        const date = email.envelope.date || new Date().toISOString()
        
        // Basic body extraction
        const body = email.source.toString().split('\r\n\r\n')[1] || "Message content is being parsed..."

        // Avoid duplicates
        const { data: existing } = await supabase
          .from('activities')
          .select('id')
          .eq('lead_id', leadId)
          .eq('title', `Inbound Email: ${subject}`)
          .limit(1)

        if (!existing || existing.length === 0) {
          // 1. Create the activity
          await supabase.from('activities').insert({
            lead_id: leadId,
            title: `Inbound Email: ${subject}`,
            type: 'email_inbound',
            content: body,
            completed: true,
            company_id: companyId,
            created_at: date
          })

          // 2. Create the notification for the lead owner
          await supabase.from('notifications').insert({
            title: 'New Email Received',
            message: `You received an email from ${lead.contact_name || lead.email}: "${subject}"`,
            type: 'email',
            user_id: lead.assigned_to, // Notify the person who owns the lead
            company_id: companyId,
            link: `/crm/leads/${leadId}`
          })
          
          count++
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()

    return new Response(JSON.stringify({ 
      count, 
      message: count > 0 ? `Synced ${count} REAL emails from your inbox.` : "No new emails found from this lead." 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('IMAP Error:', error.message)
    return new Response(JSON.stringify({ error: `Connection Error: ${error.message}. Please ensure you are using a Zoho App Password.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
