import express from 'express';
import {
  getRoles,
  getMyCertificates,
  issueCertificate,
  getSupportTickets,
  createSupportTicket,
  updateSupportTicket,
  getDashboardStats
} from '../controllers/miscController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/roles', getRoles);

// Protected routes
router.get('/certificates/my', protect, getMyCertificates);
router.post('/certificates', protect, authorize('Admin'), issueCertificate);

router.get('/support', protect, getSupportTickets);
router.post('/support', protect, createSupportTicket);
router.put('/support/:id', protect, authorize('Admin'), updateSupportTicket);

router.get('/dashboard/stats', protect, authorize('Admin'), getDashboardStats);

export default router;
