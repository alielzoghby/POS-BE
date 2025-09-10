import express from 'express';
import {
    getAllUsersController,
    createUserController,
    getUserByIdController,
    updateUserController,
} from '../controllers/users.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import CustomResponse from '../helpers/customResponse.js';
import {
    CreateUserSchema,
    UpdateUserSchema,
    UserQuerySchema,
    IdParamSchema,
    validateMiddleware,
    validateParamsMiddleware,
    validateQueryMiddleware
} from '../helpers/validate_schema.js';

const router = express.Router();

// GET /users - Get all users with pagination and filtering
router.get('/', 
    authMiddleware, 
    validateQueryMiddleware(UserQuerySchema),
    async (req, res) => {
        const [err, data] = await getAllUsersController(req.validatedQuery, req.user);
        
        if (err) {
            return err.send(res);
        }
        return data.send(res);
    }
);

// GET /users/:id - Get a specific user by ID
router.get('/:id', 
    authMiddleware,
    validateParamsMiddleware(IdParamSchema),
    async (req, res) => {
        const [err, data] = await getUserByIdController(req.validatedParams.id, req.user);
        
        if (err) {
            return err.send(res);
        }
        return data.send(res);
    }
);

// POST /users - Create a new user
router.post('/', 
    authMiddleware, 
    validateMiddleware(CreateUserSchema),
    async (req, res) => {
        const [err, data] = await createUserController(req.validatedData, req.user);
        
        if (err) {
            return err.send(res);
        }
        return data.send(res);
    }
);

// PATCH /users/:id - Update a user
router.patch('/:id', 
    authMiddleware,
    validateParamsMiddleware(IdParamSchema),
    validateMiddleware(UpdateUserSchema),
    async (req, res) => {
        const [err, data] = await updateUserController(
            req.validatedParams.id, 
            req.validatedData, 
            req.user
        );
        
        if (err) {
            return err.send(res);
        }
        return data.send(res);
    }
);

export default router;
