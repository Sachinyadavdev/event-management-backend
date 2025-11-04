import { query } from '../config/database.js';

// @desc    Register for an event
// @route   POST /api/registrations/:eventId
// @access  Private
export const registerForEvent = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user.id;

    // Check if event exists
    const eventResult = await query(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventResult.rows[0];

    // Check if event is published
    if (event.event_status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'This event is not available for registration'
      });
    }

    // Check if already registered
    const existingReg = await query(
      'SELECT id FROM registrations WHERE user_id = $1 AND event_id = $2',
      [userId, eventId]
    );

    if (existingReg.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Check if event is full
    const regCount = await query(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = $1',
      [eventId]
    );

    if (event.max_attendees && parseInt(regCount.rows[0].count) >= event.max_attendees) {
      return res.status(400).json({
        success: false,
        message: 'This event is full'
      });
    }

    // Get user role for pricing
    const userResult = await query(
      'SELECT u.*, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [userId]
    );

    const user = userResult.rows[0];
    const isMember = user.role_name === 'Member';
    const paymentAmount = isMember ? event.member_price : event.non_member_price;

    // Create registration
    const result = await query(
      `INSERT INTO registrations (user_id, event_id, payment_amount, payment_status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, eventId, paymentAmount, 'pending']
    );

    // Update event attendee count
    await query(
      'UPDATE events SET current_attendees = current_attendees + 1 WHERE id = $1',
      [eventId]
    );

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel event registration
// @route   DELETE /api/registrations/:eventId
// @access  Private
export const cancelRegistration = async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM registrations WHERE user_id = $1 AND event_id = $2 RETURNING *',
      [req.user.id, req.params.eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Update event attendee count
    await query(
      'UPDATE events SET current_attendees = GREATEST(current_attendees - 1, 0) WHERE id = $1',
      [req.params.eventId]
    );

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my registrations
// @route   GET /api/registrations/my
// @access  Private
export const getMyRegistrations = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.*, e.event_title, e.event_date, e.start_time, e.end_time, 
              e.event_category, e.cpe_hours, e.event_status
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.user_id = $1
       ORDER BY e.event_date DESC`,
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

// @desc    Get event attendees (Admin)
// @route   GET /api/registrations/event/:eventId
// @access  Private/Admin
export const getEventAttendees = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.*, u.full_name, u.email, u.phone, u.company, u.position
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1
       ORDER BY r.registration_date DESC`,
      [req.params.eventId]
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

// @desc    Mark attendee as attended (Admin)
// @route   PUT /api/registrations/:id/attended
// @access  Private/Admin
export const markAttended = async (req, res, next) => {
  try {
    const { attended, cp_score } = req.body;

    const result = await query(
      `UPDATE registrations 
       SET attended = $1, 
           attendance_date = CASE WHEN $1 = true THEN NOW() ELSE NULL END,
           cp_score = $2
       WHERE id = $3
       RETURNING *`,
      [attended, cp_score || 0, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Update user CPE score if attended
    if (attended && cp_score) {
      await query(
        'UPDATE users SET cpe_score = cpe_score + $1, last_cpe_update = NOW() WHERE id = $2',
        [cp_score, result.rows[0].user_id]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment status (Admin)
// @route   PUT /api/registrations/:id/payment
// @access  Private/Admin
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { payment_status, payment_method, transaction_id } = req.body;

    const result = await query(
      `UPDATE registrations 
       SET payment_status = $1,
           payment_method = $2,
           transaction_id = $3,
           payment_date = CASE WHEN $1 = 'completed' THEN NOW() ELSE payment_date END
       WHERE id = $4
       RETURNING *`,
      [payment_status, payment_method, transaction_id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
