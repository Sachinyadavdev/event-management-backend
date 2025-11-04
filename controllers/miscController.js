import { query } from '../config/database.js';

// @desc    Get all roles
// @route   GET /api/roles
// @access  Public
export const getRoles = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM roles ORDER BY id');

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my certificates
// @route   GET /api/certificates/my
// @access  Private
export const getMyCertificates = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, e.event_title, e.event_date, e.cpe_hours
       FROM certificates c
       JOIN events e ON c.event_id = e.id
       WHERE c.user_id = $1
       ORDER BY c.issued_date DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Issue certificate (Admin)
// @route   POST /api/certificates
// @access  Private/Admin
export const issueCertificate = async (req, res, next) => {
  try {
    const { user_id, event_id, certificate_url, cpe_credits } = req.body;

    // Check if certificate already exists
    const existing = await query(
      'SELECT id FROM certificates WHERE user_id = $1 AND event_id = $2',
      [user_id, event_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already issued for this event'
      });
    }

    // Generate certificate number
    const certificateNumber = `ISACA-${Date.now()}-${user_id}-${event_id}`;

    const result = await query(
      `INSERT INTO certificates (user_id, event_id, certificate_url, certificate_number, cpe_credits)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, event_id, certificate_url, certificateNumber, cpe_credits]
    );

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get support tickets
// @route   GET /api/support
// @access  Private
export const getSupportTickets = async (req, res, next) => {
  try {
    let queryText;
    let params;

    // Check if user is admin
    const roleResult = await query('SELECT role_name FROM roles WHERE id = $1', [req.user.role_id]);
    const isAdmin = roleResult.rows[0]?.role_name === 'Admin';

    if (isAdmin) {
      // Admin can see all tickets
      queryText = `
        SELECT t.*, u.full_name as user_name, u.email as user_email,
               a.full_name as assigned_to_name
        FROM support_tickets t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN users a ON t.assigned_to = a.id
        ORDER BY t.created_at DESC
      `;
      params = [];
    } else {
      // Users see only their tickets
      queryText = `
        SELECT t.*, a.full_name as assigned_to_name
        FROM support_tickets t
        LEFT JOIN users a ON t.assigned_to = a.id
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC
      `;
      params = [req.user.id];
    }

    const result = await query(queryText, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create support ticket
// @route   POST /api/support
// @access  Private
export const createSupportTicket = async (req, res, next) => {
  try {
    const { subject, message, category, priority } = req.body;

    const result = await query(
      `INSERT INTO support_tickets (user_id, subject, message, category, priority)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, subject, message, category || null, priority || 'Medium']
    );

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update support ticket status (Admin)
// @route   PUT /api/support/:id
// @access  Private/Admin
export const updateSupportTicket = async (req, res, next) => {
  try {
    const { status, assigned_to, priority } = req.body;

    const result = await query(
      `UPDATE support_tickets
       SET status = COALESCE($1, status),
           assigned_to = COALESCE($2, assigned_to),
           priority = COALESCE($3, priority),
           updated_at = NOW(),
           resolved_at = CASE WHEN $1 = 'Resolved' THEN NOW() ELSE resolved_at END
       WHERE id = $4
       RETURNING *`,
      [status, assigned_to, priority, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics (Admin)
// @route   GET /api/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    // Users stats
    const usersStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_users
      FROM users
    `);

    // Events stats
    const eventsStats = await query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_status = 'published' THEN 1 END) as published_events,
        COUNT(CASE WHEN event_date >= CURRENT_DATE THEN 1 END) as upcoming_events
      FROM events
    `);

    // Registrations stats
    const registrationsStats = await query(`
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as paid_registrations,
        SUM(CASE WHEN payment_status = 'completed' THEN payment_amount ELSE 0 END) as total_revenue
      FROM registrations
    `);

    // Support tickets stats
    const supportStats = await query(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'Open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved_tickets
      FROM support_tickets
    `);

    res.status(200).json({
      success: true,
      data: {
        users: usersStats.rows[0],
        events: eventsStats.rows[0],
        registrations: registrationsStats.rows[0],
        support: supportStats.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};
