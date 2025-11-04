import express from 'express';
import {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventAttendees,
  markAttended,
  updatePaymentStatus
} from '../controllers/registrationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protected routes - All users
router.use(protect);

// My registrations route (must be before /:eventId to avoid conflict)
router.get('/my', getMyRegistrations);

// Registration routes
router.post('/:eventId', registerForEvent);
router.delete('/:eventId', cancelRegistration);

// Admin only routes
router.get('/event/:eventId', authorize('Admin'), getEventAttendees);
router.put('/:id/attended', authorize('Admin'), markAttended);
router.put('/:id/payment', authorize('Admin'), updatePaymentStatus);

export default router;
