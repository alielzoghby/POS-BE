import express from 'express';
import CustomResponse from '../helpers/customResponse.js';
import { VoucherController } from '../controllers/index.js';
import { validateParamsMiddleware, validateQueryMiddleware, validateMiddleware } from '../helpers/validate_schema.js';
import { CreateVoucherSchema, UpdateVoucherSchema, VoucherQuerySchema, IdParamSchema } from '../helpers/validate_schema.js';

const router = express.Router();

// GET /vouchers
router.get('/',
  validateQueryMiddleware(VoucherQuerySchema),
  async (req, res) => {
    const [err, data] = await VoucherController.getAll(req.validatedQuery);
    if (err) return new CustomResponse(err.status, err.message, err.data).send(res);
    return data.send(res);
  }
);

// GET /vouchers/:id
router.get('/:id',
  validateParamsMiddleware(IdParamSchema),
  async (req, res) => {
    const [err, data] = await VoucherController.getById(req.validatedParams.id);
    if (err) return new CustomResponse(err.status, err.message, err.data).send(res);
    return data.send(res);
  }
);

// POST /vouchers
router.post('/',
  validateMiddleware(CreateVoucherSchema),
  async (req, res) => {
    const [err, data] = await VoucherController.create(req.validatedData);
    if (err) return new CustomResponse(err.status, err.message, err.data).send(res);
    return data.send(res);
  }
);

// PUT /vouchers/:id
router.put('/:id',
  validateParamsMiddleware(IdParamSchema),
  validateMiddleware(UpdateVoucherSchema),
  async (req, res) => {
    const [err, data] = await VoucherController.update(req.validatedParams.id, req.validatedData);
    if (err) return new CustomResponse(err.status, err.message, err.data).send(res);
    return data.send(res);
  }
);

// DELETE /vouchers/:id
router.delete('/:id',
  validateParamsMiddleware(IdParamSchema),
  async (req, res) => {
    const [err, data] = await VoucherController.remove(req.validatedParams.id);
    if (err) return new CustomResponse(err.status, err.message, err.data).send(res);
    return data.send(res);
  }
);

export default router;


