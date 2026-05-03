import express from 'express';
import userController from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/sign_up',userController.sign_up)
router.post('/sign_in',userController.sign_in)
router.get('/me',authMiddleware.authMiddleware,userController.me)
export default router;