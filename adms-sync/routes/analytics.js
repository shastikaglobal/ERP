const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db');

// GET /api/analytics/dashboard
// Returns high-level metrics for the Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    
    // 1. Total Leads
    let leadsQuery = `SELECT COUNT(*) as total FROM leads WHERE is_deleted = false`;
    const leadsParams = [];
    if (company_id) {
      leadsQuery += ` AND company_id = $1`;
      leadsParams.push(company_id);
    }
    const leadsRes = await db.query(leadsQuery, leadsParams);
    const totalLeads = parseInt(leadsRes.rows[0].total, 10);

    // 2. Closed Deals (Won Leads + Export Orders)
    // Query for leads with "Won" or "Client Successfully Acquired" stages (case-insensitive)
    let wonLeadsQuery = `
      SELECT COUNT(*) as total FROM leads 
      WHERE is_deleted = false 
      AND (
        LOWER(TRIM(stage)) = 'won' 
        OR LOWER(TRIM(stage)) = 'client successfully acquired'
      )
    `;
    const wonLeadsParams = [];
    if (company_id) {
      wonLeadsQuery += ` AND company_id = $1`;
      wonLeadsParams.push(company_id);
    }
    const wonLeadsRes = await db.query(wonLeadsQuery, wonLeadsParams);
    
    console.log(`[Analytics Dashboard] Won Leads Query - Count: ${wonLeadsRes.rows[0].total}, Company: ${company_id || 'all'}`);
    
    let ordersQuery = `SELECT COUNT(*) as total FROM export_orders WHERE is_deleted = false`;
    const ordersParams = [];
    if (company_id) {
      ordersQuery += ` AND company_id = $1`;
      ordersParams.push(company_id);
    }
    const ordersRes = await db.query(ordersQuery, ordersParams);
    const closedWonLeads = Math.max(parseInt(wonLeadsRes.rows[0].total, 10), parseInt(ordersRes.rows[0].total, 10));

    // 3. Pending Activities & Follow-ups
    let pendingActQuery = `SELECT COUNT(*) as total FROM activities WHERE completed = false AND is_deleted = false`;
    let pendingActParams = [];
    if (company_id) {
      pendingActQuery += ` AND company_id = $1`;
      pendingActParams.push(company_id);
    }
    const pendingActRes = await db.query(pendingActQuery, pendingActParams);

    let followUpQuery = `SELECT COUNT(*) as total FROM follow_ups WHERE is_notified = false AND is_deleted = false`;
    // follow_ups doesn't have company_id directly, so we join leads if company_id is provided
    let followUpParams = [];
    if (company_id) {
      followUpQuery = `
        SELECT COUNT(f.*) as total 
        FROM follow_ups f
        JOIN leads l ON f.lead_id = l.id
        WHERE f.is_notified = false AND f.is_deleted = false AND l.company_id = $1
      `;
      followUpParams.push(company_id);
    }
    const followUpRes = await db.query(followUpQuery, followUpParams);
    const totalPending = parseInt(pendingActRes.rows[0].total, 10) + parseInt(followUpRes.rows[0].total, 10);

    // 4. Overdue Activities
    let overdueActQuery = `SELECT COUNT(*) as total FROM activities WHERE completed = false AND due_date < NOW() AND is_deleted = false`;
    let overdueActParams = [];
    if (company_id) {
      overdueActQuery += ` AND company_id = $1`;
      overdueActParams.push(company_id);
    }
    const overdueActRes = await db.query(overdueActQuery, overdueActParams);
    const overdueActivities = parseInt(overdueActRes.rows[0].total, 10);

    // 5. Total Revenue (from approved quotations)
    let revQuery = `SELECT COALESCE(SUM(COALESCE(total_amount, amount)), 0) as total FROM quotations WHERE status = 'Approved' AND is_deleted = false`;
    let revParams = [];
    // Currently quotes may not have company_id in all schemas, but if they do:
    if (company_id) {
      // Join with leads to ensure we get quotes for this company if company_id isn't on quotes directly
      revQuery = `
        SELECT COALESCE(SUM(COALESCE(q.total_amount, q.amount)), 0) as total 
        FROM quotations q
        LEFT JOIN leads l ON q.lead_id = l.id
        WHERE q.status = 'Approved' AND q.is_deleted = false 
        AND (q.company_id = $1 OR l.company_id = $1)
      `;
      revParams.push(company_id);
    }
    const revRes = await db.query(revQuery, revParams);
    const totalRevenue = parseFloat(revRes.rows[0].total);

    // 6. Recent Activity
    let recentQuery = `
      SELECT a.type, a.title, a.created_at, l.company_name as lead_company_name
      FROM activities a
      LEFT JOIN leads l ON a.lead_id = l.id
      WHERE a.is_deleted = false
    `;
    let recentParams = [];
    if (company_id) {
      recentQuery += ` AND (a.company_id = $1 OR l.company_id = $1)`;
      recentParams.push(company_id);
    }
    recentQuery += ` ORDER BY a.created_at DESC LIMIT 5`;
    const recentRes = await db.query(recentQuery, recentParams);

    res.json({
      totalLeads,
      closedWonLeads,
      conversionRate: totalLeads > 0 ? Math.round((closedWonLeads / totalLeads) * 100) : 0,
      totalPending,
      overdueActivities,
      totalRevenue,
      recentActivities: recentRes.rows.map(r => ({
        type: r.type,
        title: r.title,
        created_at: r.created_at,
        leads: r.lead_company_name ? { company_name: r.lead_company_name } : null
      }))
    });

  } catch (err) {
    console.error("Analytics Error (dashboard):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/analytics/lead_funnel
// Returns aggregated lead counts by stage
router.get('/lead_funnel', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    let query = `
      SELECT stage, COUNT(*) as count 
      FROM leads 
      WHERE is_deleted = false
    `;
    const params = [];
    if (company_id) {
      query += ` AND company_id = $1`;
      params.push(company_id);
    }
    query += ` GROUP BY stage`;

    const result = await db.query(query, params);
    
    // Format to key-value pairs or array
    const breakdown = result.rows.map(r => [r.stage || 'Unknown', parseInt(r.count, 10)]);
    breakdown.sort((a, b) => b[1] - a[1]);
    
    res.json(breakdown);
  } catch (err) {
    console.error("Analytics Error (lead_funnel):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/analytics/revenue
// Returns monthly revenue trend for the last 6 months
router.get('/revenue', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    
    let query = `
      SELECT 
        DATE_TRUNC('month', q.created_at) as month,
        SUM(COALESCE(q.total_amount, q.amount)) as revenue
      FROM quotations q
      LEFT JOIN leads l ON q.lead_id = l.id
      WHERE q.status = 'Approved' AND q.is_deleted = false
        AND q.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
    `;
    
    const params = [];
    if (company_id) {
      query += ` AND (q.company_id = $1 OR l.company_id = $1)`;
      params.push(company_id);
    }
    
    query += ` GROUP BY DATE_TRUNC('month', q.created_at) ORDER BY month ASC`;
    
    const result = await db.query(query, params);
    
    res.json(result.rows.map(r => ({
      month: r.month,
      revenue: parseFloat(r.revenue || 0)
    })));
  } catch (err) {
    console.error("Analytics Error (revenue):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/analytics/performance
// Returns BDE performance
router.get('/performance', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;
    
    // Revenue by BDE (via quotations -> leads -> assigned_to -> profiles)
    // assigned_to could be profile ID or full_name based on past implementation, we'll join assuming ID or match by name
    let query = `
      SELECT 
        COALESCE(p.full_name, l.assigned_to) as employee_name,
        SUM(COALESCE(q.total_amount, q.amount)) as total_revenue
      FROM quotations q
      JOIN leads l ON q.lead_id = l.id
      LEFT JOIN profiles p ON p.id::text = l.assigned_to OR p.full_name = l.assigned_to
      WHERE q.status = 'Approved' AND q.is_deleted = false AND l.assigned_to IS NOT NULL
    `;
    
    const params = [];
    if (company_id) {
      query += ` AND (q.company_id = $1 OR l.company_id = $1)`;
      params.push(company_id);
    }
    
    query += ` GROUP BY COALESCE(p.full_name, l.assigned_to) ORDER BY total_revenue DESC LIMIT 5`;
    
    const result = await db.query(query, params);
    
    res.json(result.rows.map(r => [r.employee_name, parseFloat(r.total_revenue || 0)]));
  } catch (err) {
    console.error("Analytics Error (performance):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/analytics/reports_raw
// Returns all raw data needed by Reports.tsx
router.get('/reports_raw', requireAuth, async (req, res) => {
  try {
    const { company_id } = req.query;

    const getTable = async (table, extraWhere = '', orderBy = '') => {
      let q = `SELECT * FROM ${table} WHERE is_deleted = false`;
      const params = [];
      if (company_id) {
        // Only profiles and export_orders have company_id definitively in all schemas.
        // Assuming most of these have company_id or we filter later. 
        // For safety, if company_id column exists we should filter, but let's just do it dynamically or omit if tricky.
        // Actually, the frontend downloaded everything. Let's replicate frontend behavior: return all for now.
        // To be safe with company_id:
        if (table !== 'client_acquisition' && table !== 'bde_daily_reports') {
            q += ` AND (company_id = $1 OR company_id IS NULL)`;
            params.push(company_id);
        }
      }
      if (extraWhere) q += ` AND ${extraWhere}`;
      if (orderBy) q += ` ORDER BY ${orderBy}`;
      
      try {
        const result = await db.query(q, params);
        return result.rows;
      } catch (e) {
        // If table doesn't have company_id, fallback
        if (e.message.includes('company_id')) {
           const fallbackQ = `SELECT * FROM ${table} WHERE is_deleted = false` + (orderBy ? ` ORDER BY ${orderBy}` : '');
           const fallbackRes = await db.query(fallbackQ);
           return fallbackRes.rows;
        }
        return [];
      }
    };

    // Profiles doesn't have is_deleted typically, let's just select all
    const profilesRes = await db.query(`SELECT id, full_name, avatar_url, role, monthly_target FROM profiles ${company_id ? 'WHERE company_id = $1' : ''}`, company_id ? [company_id] : []);
    
    const [
      leads, activities, followUps, quotations, exportOrders, acquisitions, dailyReports
    ] = await Promise.all([
      getTable('leads', '', 'created_at DESC'),
      getTable('activities'),
      getTable('follow_ups'),
      getTable('quotations'),
      getTable('export_orders'),
      getTable('client_acquisition'),
      getTable('bde_daily_reports', '', 'report_date DESC')
    ]);

    res.json({
      profiles: profilesRes.rows || [],
      leads: leads || [],
      activities: activities || [],
      followUps: followUps || [],
      quotations: quotations || [],
      exportOrders: exportOrders || [],
      acquisitions: acquisitions || [],
      dailyReports: dailyReports || []
    });

  } catch (err) {
    console.error("Analytics Error (reports_raw):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/analytics/daily_reports
router.post('/daily_reports', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    data.company_id = req.user.company_id || data.company_id;
    
    const columns = Object.keys(data).filter(k => data[k] !== undefined);
    const values = columns.map(k => data[k]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    await db.query(
      `INSERT INTO bde_daily_reports (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Analytics Error (post daily_reports):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
