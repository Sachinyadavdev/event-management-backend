import express from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
  testDateHandling
} from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Debug route for date testing
router.post('/test-date', testDateHandling);

// Admin stats route (must be before /:id to avoid conflict)
router.get('/stats', protect, authorize('Admin'), getEventStats);

// Public routes
router.get('/', getEvents);
router.get('/:id', getEvent);

// Protected routes - Admin only
router.post('/', protect, authorize('Admin'), createEvent);
router.put('/:id', protect, authorize('Admin'), updateEvent);
router.delete('/:id', protect, authorize('Admin'), deleteEvent);

export default router;
