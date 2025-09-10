import express from "express";
import CustomResponse from '../helpers/customResponse.js';
import { CategoryController } from '../controllers/index.js';
import { validateParamsMiddleware, validateQueryMiddleware, validateMiddleware } from '../helpers/validate_schema.js';
import { CreateCategorySchema, UpdateCategorySchema, CategoryQuerySchema, IdParamSchema } from '../helpers/validate_schema.js';

const router = express.Router();

// GET /categories - Get all categories with filtering and pagination
router.get('/', 
  validateQueryMiddleware(CategoryQuerySchema),
  async (req, res, next) => {
    const [err, data] = await CategoryController.getAll(req.query);
    if (err) {
      return new CustomResponse(err.status, err.message, err.data).send(res);
    }
    return data.send(res);
  }
);

// GET /categories/:id - Get category by ID
router.get('/:id', 
  validateParamsMiddleware(IdParamSchema),
  async (req, res, next) => {
    const [err, data] = await CategoryController.getById(req.params.id);
    if (err) {
      return new CustomResponse(err.status, err.message, err.data).send(res);
    }
    return data.send(res);
  }
);

// POST /categories - Create new category
router.post('/', 
  validateMiddleware(CreateCategorySchema),
  async (req, res, next) => {
    try {
      // Call the controller
      const [err, data] = await CategoryController.create(req.validatedData || req.body);
      if (err) {
        return new CustomResponse(err.status, err.message, err.data).send(res);
      }
      return data.send(res);

    } catch (error) {
      return new CustomResponse(500, error.message).send(res);
    }
  }
);

// PUT /categories/:id - Update category by ID
router.put('/:id',
  validateParamsMiddleware(IdParamSchema),
  validateMiddleware(UpdateCategorySchema),
  async (req, res, next) => {
    try {
      // Call the controller
      const [err, data] = await CategoryController.update(req.params.id, req.validatedData || req.body);
      if (err) {
        return new CustomResponse(err.status, err.message, err.data).send(res);
      }
      return data.send(res);

    } catch (error) {
      return new CustomResponse(500, error.message).send(res);
    }
  }
);

// DELETE /categories/:id - Delete category by ID
router.delete('/:id',
  validateParamsMiddleware(IdParamSchema),
  async (req, res) => {
    const [err, data] = await CategoryController.delete(req.params.id);
    if (err) {
      return new CustomResponse(err.status, err.message, err.data).send(res);
    }
    return data.send(res);
  }
);

export default router;