import { Router } from 'express';
import CustomerController from '../controllers/customerController';
import { auth, AuthRequest } from '../middlewares/authMiddleware';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const customerController = new CustomerController();

const withAuth = (handler: (req: AuthRequest, res: Response, next: NextFunction) => any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    return handler(authReq, res, next);
  };
}; 

router.post('/auth/login', customerController.login.bind(customerController));
router.post('/auth/register', customerController.register.bind(customerController));

router.get('/profile', auth, withAuth((req: AuthRequest, res: Response) => {
  return customerController.getProfile(req, res);
}));
router.put('/profile', auth, withAuth((req: AuthRequest, res: Response) => {
  return customerController.updateProfile(req, res);
}));
router.post('/change-password', auth, withAuth((req: AuthRequest, res: Response) => {
  return customerController.changePassword(req, res);
}));

router.get('/', auth, customerController.getAllCustomers.bind(customerController));
router.get('/:id', auth, customerController.getCustomerById.bind(customerController));
router.put('/:id', auth, customerController.updateCustomer.bind(customerController));
router.delete('/:id', auth, customerController.deleteCustomer.bind(customerController));

export default router;