import { query } from '../config/database.js';

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const { status, role, search, page = 1, limit = 10 } = req.query;
    
    let queryText = `
      SELECT u.id, u.full_name, u.email, u.phone, u.company, u.position, 
             u.department, u.location, u.status, u.verified, u.cpe_score,
             u.last_login, u.created_at, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Filter by status
    if (status) {
      queryText += ` AND u.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Filter by role
    if (role) {
      queryText += ` AND r.role_name = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }

    // Search by name or email
    if (search) {
      queryText += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      queryText.replace('SELECT u.id, u.full_name, u.email, u.phone, u.company, u.position, u.department, u.location, u.status, u.verified, u.cpe_score, u.last_login, u.created_at, r.role_name', 'SELECT COUNT(*)')
      , queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    const offset = (page - 1) * limit;
    queryText += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.*, r.role_name,
        (SELECT COUNT(*) FROM registrations WHERE user_id = u.id) as total_events,
        (SELECT COUNT(*) FROM registrations WHERE user_id = u.id AND attended = true) as attended_events,
        (SELECT COUNT(*) FROM certificates WHERE user_id = u.id) as total_certificates
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];
    delete user.password;

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const {
      full_name,
      email,
      phone,
      company,
      position,
      department,
      location,
      experience,
      membership_details,
      certifications,
      cpe_score,
      verified
    } = req.body;

    const result = await query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           company = COALESCE($4, company),
           position = COALESCE($5, position),
           department = COALESCE($6, department),
           location = COALESCE($7, location),
           experience = COALESCE($8, experience),
           membership_details = COALESCE($9, membership_details),
           certifications = COALESCE($10, certifications),
           cpe_score = COALESCE($11, cpe_score),
           verified = COALESCE($12, verified),
           updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [full_name, email, phone, company, position, department, location, 
       experience, membership_details, certifications, cpe_score, verified, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];
    delete user.password;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['pending', 'active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const result = await query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, status',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res, next) => {
  try {
    const { role_id } = req.body;

    // Verify role exists
    const roleCheck = await query('SELECT id FROM roles WHERE id = $1', [role_id]);
    
    if (roleCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role ID'
      });
    }

    const result = await query(
      `UPDATE users SET role_id = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, full_name, email, role_id`,
      [role_id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
export const getUserStats = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_users,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_this_month
      FROM users
    `);

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
