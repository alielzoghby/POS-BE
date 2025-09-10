import express from 'express';
import {
    loginController,
    isAuthenticatedController
} from '../controllers/auth.js';
import CustomResponse from '../helpers/customResponse.js';
import {
    LoginSchema,
    validateMiddleware
} from '../helpers/validate_schema.js';

const router = express.Router();

router.post('/login', 
    validateMiddleware(LoginSchema),
    async (req, res) => {
        const [err, data] = await loginController(req.validatedData);
        
        if (err) {
            return err.send(res);
        }
        return data.send(res);
    }
);

// Custom middleware to validate Authorization header
const validateTokenMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).json({
            status: 400,
            message: 'Authorization header with Bearer token is required',
            data: null
        });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(400).json({
            status: 400,
            message: 'Token is required in Authorization header',
            data: null
        });
    }
    
    req.token = token;
    next();
};

router.get('/authenticated', 
    validateTokenMiddleware,
    async (req, res) => {
        const [err, data] = await isAuthenticatedController(req.token);
        
        if (err) {
            return err.send(res);
        }
        return data.send(res);
    }
);

export default router;
