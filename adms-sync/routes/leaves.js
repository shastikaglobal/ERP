const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/leaves - Fetch leave requests based on user role (Employee, Manager, HR)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    
    // Determine user role and if they are a manager
    const profRes = await db.query('SELECT role FROM profiles WHERE id = $1', [userId]);
    const userRole = profRes.rows.length > 0 ? profRes.rows[0].role?.toLowerCase() : 'employee';
    const isHR = ['hr', 'admin', 'director'].includes(userRole);
    
    let query = `
      SELECT lr.*, 
             p.full_name as employee_name, p.department as employee_department, p.employee_id as emp_code,
             m.full_name as manager_name,
             h.full_name as hr_name
      FROM leave_requests lr
      LEFT JOIN profiles p ON lr.employee_id = p.id
      LEFT JOIN profiles m ON lr.manager_id = m.id
      LEFT JOIN profiles h ON lr.hr_id = h.id
    `;
    let params = [];
    
    if (isHR) {
      // HR sees all
      query += ` ORDER BY lr.created_at DESC`;
    } else {
      // Check if user is a manager for anyone
      const mgrRes = await db.query('SELECT id FROM profiles WHERE manager_id = $1 LIMIT 1', [userId]);
      const isManager = mgrRes.rows.length > 0;
      
      if (isManager) {
        // Manager sees their own leaves AND leaves of their direct reports
        query += ` WHERE lr.employee_id = $1 OR p.manager_id = $1 ORDER BY lr.created_at DESC`;
        params.push(userId);
      } else {
        // Regular employee sees only their own
        query += ` WHERE lr.employee_id = $1 ORDER BY lr.created_at DESC`;
        params.push(userId);
      }
    }
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching leaves:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/leaves/balances - Fetch leave balances for the user or everyone if HR
router.get('/balances', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const year = new Date().getFullYear();
    
    const profRes = await db.query('SELECT role FROM profiles WHERE id = $1', [userId]);
    const userRole = profRes.rows.length > 0 ? profRes.rows[0].role?.toLowerCase() : 'employee';
    const isHR = ['hr', 'admin', 'director'].includes(userRole);
    
    let query = `
      SELECT lb.*, p.full_name, p.department, p.employee_id as emp_code
      FROM leave_balances lb
      JOIN profiles p ON lb.employee_id = p.id
      WHERE lb.year = $1
    `;
    let params = [year];
    
    if (!isHR) {
      query += ` AND lb.employee_id = $2`;
      params.push(userId);
    }
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching leave balances:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/leaves/calendar - Fetch approved leaves for the calendar view
router.get('/calendar', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT lr.id, lr.from_date, lr.to_date, lr.leave_type, p.full_name as employee_name, p.department
      FROM leave_requests lr
      JOIN profiles p ON lr.employee_id = p.id
      WHERE lr.status = 'Approved'
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching calendar leaves:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/leaves - Apply for leave
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { leave_type, from_date, to_date, reason, number_of_days, attachment_url } = req.body;
    
    if (!leave_type || !from_date || !to_date || !number_of_days) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get the user's manager
    const profRes = await db.query('SELECT manager_id FROM profiles WHERE id = $1', [userId]);
    const manager_id = profRes.rows.length > 0 ? profRes.rows[0].manager_id : null;
    
    // Initial status depends on whether they have a manager
    const manager_status = manager_id ? 'Pending' : 'Approved'; // If no manager, auto-approve manager step
    const status = 'Pending';
    
    const query = `
      INSERT INTO leave_requests 
      (employee_id, leave_type, from_date, to_date, reason, number_of_days, attachment_url, manager_id, manager_status, hr_status, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending', $10)
      RETURNING *
    `;
    const values = [userId, leave_type, from_date, to_date, reason, number_of_days, attachment_url, manager_id, manager_status, status];
    
    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error applying for leave:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/leaves/:id/approve - Approve/Reject leave
router.put('/:id/approve', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, stage } = req.body; // action: 'Approve' or 'Reject', stage: 'Manager' or 'HR'
    const userId = req.user.sub;
    
    const leaveRes = await db.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
    if (leaveRes.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    const leave = leaveRes.rows[0];
    let updateQuery = '';
    let params = [];
    
    if (stage === 'Manager') {
      // Validate that the user is actually the manager (or HR)
      if (leave.manager_id !== userId) {
        const profRes = await db.query('SELECT role FROM profiles WHERE id = $1', [userId]);
        const userRole = profRes.rows.length > 0 ? profRes.rows[0].role?.toLowerCase() : 'employee';
        if (!['hr', 'admin', 'director'].includes(userRole)) {
            return res.status(403).json({ error: 'Unauthorized to approve as manager' });
        }
      }
      
      const newStatus = action === 'Approve' ? 'Approved' : 'Rejected';
      const overallStatus = action === 'Approve' ? 'Pending' : 'Rejected'; // If rejected by manager, overall is rejected
      
      updateQuery = `UPDATE leave_requests SET manager_status = $1, status = $2 WHERE id = $3 RETURNING *`;
      params = [newStatus, overallStatus, id];
    } else if (stage === 'HR') {
      // Validate that user is HR
      const profRes = await db.query('SELECT role FROM profiles WHERE id = $1', [userId]);
      const userRole = profRes.rows.length > 0 ? profRes.rows[0].role?.toLowerCase() : 'employee';
      if (!['hr', 'admin', 'director'].includes(userRole)) {
          return res.status(403).json({ error: 'Unauthorized to approve as HR' });
      }
      
      const newStatus = action === 'Approve' ? 'Approved' : 'Rejected';
      const overallStatus = newStatus;
      
      updateQuery = `UPDATE leave_requests SET hr_status = $1, hr_id = $2, approved_by = $2, status = $3 WHERE id = $4 RETURNING *`;
      params = [newStatus, userId, overallStatus, id];
    } else {
      return res.status(400).json({ error: 'Invalid stage' });
    }
    
    const { rows } = await db.query(updateQuery, params);
    const updatedLeave = rows[0];
    
    // If HR approved, deduct balance
    if (stage === 'HR' && action === 'Approve') {
        const year = new Date(updatedLeave.from_date).getFullYear();
        // Check if balance exists, else create it
        const checkBal = await db.query('SELECT id FROM leave_balances WHERE employee_id = $1 AND year = $2 AND leave_type = $3', [updatedLeave.employee_id, year, updatedLeave.leave_type]);
        
        if (checkBal.rows.length > 0) {
            await db.query('UPDATE leave_balances SET used = used + $1 WHERE id = $2', [updatedLeave.number_of_days, checkBal.rows[0].id]);
        } else {
            await db.query('INSERT INTO leave_balances (employee_id, year, leave_type, used, allocated) VALUES ($1, $2, $3, $4, 0)', [updatedLeave.employee_id, year, updatedLeave.leave_type, updatedLeave.number_of_days]);
        }
    }
    
    res.json(updatedLeave);
  } catch (err) {
    console.error('Error approving leave:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
