import { Router } from 'express';
import { getUsers, getUser, createUser } from '../controllers/users';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/', auth, getUsers);
router.get('/:id', auth, getUser);
router.post('/:id', createUser);

export default router;
