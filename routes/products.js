import express from 'express';
import CustomResponse from '../helpers/customResponse.js';
import imageUploadMiddleware, {
  upload,
  handleMulterError,
  base64Image,
  getImageUrl,
} from '../middlewares/image_upload.js';
import { ProductController } from '../controllers/index.js';
import { validateParamsMiddleware, validateQueryMiddleware } from '../helpers/validate_schema.js';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductQuerySchema,
  IdParamSchema,
} from '../helpers/validate_schema.js';

const router = express.Router();

// GET /products - Get all products with filtering and pagination
router.get('/', validateQueryMiddleware(ProductQuerySchema), async (req, res, next) => {
  const [err, data] = await ProductController.getAll(req.validatedQuery || req.query);
  if (err) {
    return new CustomResponse(err.status, err.message).send(res);
  }
  return data.send(res);
});

// GET /products/:id - Get product by ID
router.get('/:id', validateParamsMiddleware(IdParamSchema), async (req, res, next) => {
  const [err, data] = await ProductController.getById(req.params.id);
  if (err) {
    return new CustomResponse(err.status, err.message).send(res);
  }
  return data.send(res);
});

// POST /products - Create new product with image upload
router.post('/', base64Image, upload.single('image'), handleMulterError, async (req, res, next) => {
  try {
    // If multipart image exists, prefer it; base64Image middleware already set req.body.image
    if (req.file && !req.body.image) {
      req.body.image = getImageUrl(req, req.file.filename);
    }

    // If client sent empty image ("" or null), do not overwrite existing image
    if (Object.prototype.hasOwnProperty.call(req.body, 'image')) {
      const img = req.body.image;
      if (img === null || (typeof img === 'string' && img.trim() === '')) {
        delete req.body.image;
      }
    }

    // Set default image if not provided
    if (!req.body.image || req.body.image.trim() === '') {
      req.body.image = `${req.protocol}://${req.get('host')}/api/uploads/default-product.png`;
    }

    // Convert string numbers to actual numbers for validation
    if (req.body.base_price) req.body.base_price = parseFloat(req.body.base_price);
    if (req.body.final_price) req.body.final_price = parseFloat(req.body.final_price);
    if (req.body.quantity) req.body.quantity = parseInt(req.body.quantity);
    if (req.body.category_id) req.body.category_id = parseInt(req.body.category_id);
    if (req.body.unit_value) req.body.unit_value = parseInt(req.body.unit_value);
    if (req.body.unit_price) req.body.unit_price = parseInt(req.body.unit_price);

    // Convert string booleans to actual booleans
    if (req.body.show_online !== undefined) req.body.show_online = req.body.show_online === 'true';
    if (req.body.sub_product !== undefined) req.body.sub_product = req.body.sub_product === 'true';

    // status is handled as enum string by validation in controller

    // Call the controller
    const [err, data] = await ProductController.create(req.body);
    if (err) {
      return new CustomResponse(err.status, err.message, err.data).send(res);
    }
    return data.send(res);
  } catch (error) {
    return new CustomResponse(500, error.message).send(res);
  }
});

// PUT /products/:id - Update product by ID with optional image upload
router.patch(
  '/:id',
  validateParamsMiddleware(IdParamSchema),
  base64Image,
  upload.single('image'),
  handleMulterError,
  async (req, res, next) => {
    try {
      // If multipart image exists, prefer it; base64Image middleware already set req.body.image
      if (req.file && !req.body.image) {
        req.body.image = getImageUrl(req, req.file.filename);
      }

      // If client sent empty image ("" or null), do not overwrite existing image
      if (Object.prototype.hasOwnProperty.call(req.body, 'image')) {
        const img = req.body.image;
        if (img === null || (typeof img === 'string' && img.trim() === '')) {
          delete req.body.image;
        }
      }

      // Convert string numbers to actual numbers for validation
      if (req.body.base_price) req.body.base_price = parseFloat(req.body.base_price);
      if (req.body.final_price) req.body.final_price = parseFloat(req.body.final_price);
      if (req.body.quantity) req.body.quantity = parseInt(req.body.quantity);
      if (req.body.category_id) req.body.category_id = parseInt(req.body.category_id);
      if (req.body.unit_value) req.body.unit_value = parseInt(req.body.unit_value);
      if (req.body.unit_price) req.body.unit_price = parseInt(req.body.unit_price);

      // Convert string booleans to actual booleans
      if (req.body.show_online !== undefined)
        req.body.show_online = req.body.show_online === 'true';
      if (req.body.sub_product !== undefined)
        req.body.sub_product = req.body.sub_product === 'true';

      // status is handled as enum string by validation in controller

      // Call the controller
      const [err, data] = await ProductController.update(req.params.id, req.body);
      if (err) {
        return new CustomResponse(err.status, err.message, err.data).send(res);
      }
      return data.send(res);
    } catch (error) {
      return new CustomResponse(500, error.message).send(res);
    }
  }
);

// DELETE /products/:id - Delete product by ID
router.delete('/:id', validateParamsMiddleware(IdParamSchema), async (req, res) => {
  const [err, data] = await ProductController.delete(req.params.id);
  if (err) {
    return new CustomResponse(err.status, err.message).send(res);
  }
  return data.send(res);
});

// DELETE /products - Bulk delete products by array of ids in body
router.delete('/', async (req, res) => {
  const ids = req.body?.ids || req.body;
  const [err, data] = await ProductController.deleteMany(ids);
  if (err) {
    return new CustomResponse(err.status, err.message, err.data).send(res);
  }
  return data.send(res);
});

// POST /products/multiple - Create product with multiple images (commented out for now)
// router.post('/multiple',
//   uploadMultiple.array('images', 5),
//   handleMulterError,
//   async (req, res, next) => {
//     try {
//       if (!req.files || req.files.length === 0) {
//         return new CustomResponse(400, 'At least one image is required').send(res);
//       }

//       // Add image URLs to request body
//       req.body.images = getImageUrls(req, req.files);

//       // Your controller logic here
//       // const [err, data] = await ProductController.createWithMultipleImages(req.body);

//       // For now, return success response
//       return new CustomResponse(201, 'Product created successfully with multiple images', {
//         ...req.body,
//         images: req.body.images,
//         imageCount: req.files.length
//       }).send(res);

//     } catch (error) {
//       return new CustomResponse(500, error.message).send(res);
//     }
//   }
// );

// POST /products/validate - File validation route (for testing)
router.post('/validate', upload.single('image'), handleMulterError, (req, res) => {
  if (!req.file) {
    return new CustomResponse(400, 'No file provided for validation').send(res);
  }

  return new CustomResponse(200, 'File is valid', {
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    sizeFormatted: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
    url: getImageUrl(req, req.file.filename),
  }).send(res);
});

//POST /create-sub-product
router.post('/create-sub-product', async (req, res) => {
  const [err, data] = await ProductController.createSubProduct(req.body);
  if (err) {
    return new CustomResponse(err.status, err.message, err.data).send(res);
  }
  return data.send(res);
});

export default router;
