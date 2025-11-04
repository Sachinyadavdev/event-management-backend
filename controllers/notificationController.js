import { query } from '../config/database.js';

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const { unread_only = false, page = 1, limit = 20 } = req.query;

    let queryText = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;

    const queryParams = [req.user.id];

    if (unread_only === 'true') {
      queryText += ' AND is_read = false';
    }

    // Get total count
    const countResult = await query(
      queryText.replace('SELECT *', 'SELECT COUNT(*)'),
      queryParams
    );
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    const offset = (page - 1) * limit;
    queryText += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
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

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW() 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      message: `${result.rowCount} notifications marked as read`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create notification (Admin)
// @route   POST /api/notifications
// @access  Private/Admin
export const createNotification = async (req, res, next) => {
  try {
    const { user_id, title, message, notification_type } = req.body;

    const result = await query(
      `INSERT INTO notifications (user_id, title, message, notification_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, title, message, notification_type || 'system']
    );

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: {
        unread_count: parseInt(result.rows[0].count)
      }
    });
  } catch (error) {
    next(error);
  }
};
