import prisma from '../utils/prismaClient.js';
import {
  CreateProductSchema,
  CreateSubProductSchema,
  UpdateProductSchema,
  validateSchema,
} from '../helpers/validate_schema.js';
import CustomResponse from '../helpers/customResponse.js';
import { generateReference } from '../helpers/generate-reference.js';

// Create a new product
const create = async (data) => {
  const validation = validateSchema(CreateProductSchema, data);
  if (!validation.success) {
    return [
      new CustomResponse(400, 'Validation failed', {
        errors: validation.error,
        receivedData: data,
      }),
      null,
    ];
  }

  const validatedData = validation.data;

  //set reference
  if (!validatedData.reference || validatedData.reference.trim() === '') {
    validatedData.reference = generateReference();
  }

  // ✅ check if sub product
  if (validatedData.sub_product && validatedData.parent_id) {
    const parent = await prisma.product.findUnique({
      where: { product_id: validatedData.parent_id },
    });

    if (!parent) {
      return [new CustomResponse(404, 'Parent product not found'), null];
    }

    // Validate that parent can have sub-products
    if (!parent.unit || !parent.unit_value || !parent.unit_price) {
      return [new CustomResponse(400, 'Parent product cannot have sub-products'), null];
    }

    if (parent.unit_value < validatedData.unit_value) {
      return [new CustomResponse(400, 'Not enough unit_value available in parent'), null];
    }

    // Update parent
    let newUnitValue = parent.unit_value - validatedData.unit_value;
    let newQuantity = parent.quantity;

    if (newUnitValue === 0) {
      newQuantity = parent.quantity - 1;
      newUnitValue = parent.original_unit_value;
    }

    await prisma.product.update({
      where: { product_id: parent.product_id },
      data: {
        unit_value: newUnitValue,
        quantity: newQuantity,
      },
    });

    // subProduct is created
    const newSubProduct = await prisma.product.create({
      data: {
        ...validatedData,
        reference: generateReference(),
        sub_product: true,
        original_unit_value: validatedData.unit_value,
        quantity: 1,
      },
    });

    return [null, new CustomResponse(201, 'Sub-product created successfully', newSubProduct)];
  }

  const existingProduct = await prisma.product.findFirst({
    where: { reference: validatedData.reference },
  });
  if (existingProduct) {
    return [new CustomResponse(409, 'Product with this reference already exists'), null];
  }
  const newProduct = await prisma.product.create({
    data: {
      ...validatedData,
      original_unit_value: validatedData.original_unit_value ?? validatedData.unit_value,
    },
  });
  return [null, new CustomResponse(201, 'Product created successfully', newProduct)];
};
// const create = asyncWrapper(async (req, res) => {
//   // Validate the request data
//   const validation = validateSchema(CreateProductSchema, req.body);

//   if (!validation.success) {
//     return res.status(400).json({
//       status: 400,
//       message: 'Validation failed',
//       data: {
//         errors: validation.error
//       }
//     });
//   }

//   const validatedData = validation.data;

//   try {
//     // Check if product with same reference already exists
//     const existingProduct = await prisma.product.findFirst({
//       where: { reference: validatedData.reference }
//     });

//     if (existingProduct) {
//       return res.status(409).json({
//         status: 409,
//         message: 'Product with this reference already exists',
//         data: null
//       });
//     }

//     // Create the product
//     const newProduct = await prisma.product.create({
//       data: validatedData
//     });

//     return res.status(201).json({
//       status: 201,
//       message: 'Product created successfully',
//       data: newProduct
//     });

//   } catch (error) {
//     return res.status(500).json({
//       status: 500,
//       message: 'Failed to create product',
//       data: {
//         error: error.message
//       }
//     });
//   }
// });

// Get all products with optional filtering
const getAll = async (query) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      reference,
      category_id,
      status,
      minPrice,
      maxPrice,
      sortBy = 'product_id',
      sortOrder = 'asc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [];
      where.OR.push({ name: { contains: search } });
      where.OR.push({ reference: { contains: search } });
    }

    if (reference) {
      where.reference = { contains: reference };
    }

    if (category_id) {
      where.category_id = parseInt(category_id);
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (minPrice || maxPrice) {
      where.final_price = {};
      if (minPrice) where.final_price.gte = parseFloat(minPrice);
      if (maxPrice) where.final_price.lte = parseFloat(maxPrice);
    }

    const allowedSortFields = ['product_id', 'name', 'final_price', 'createdAt'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'product_id';

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { [safeSortBy]: sortOrder },
        include: {
          category: {
            select: {
              category_id: true,
              name: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / take);

    return [
      null,
      new CustomResponse(200, 'Products retrieved successfully', {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalDocuments: totalCount,
          itemsPerPage: take,
        },
      }),
    ];
  } catch (error) {
    return [
      new CustomResponse(500, 'Failed to retrieve products', {
        error: error.message,
      }),
      null,
    ];
  }
};

// Get product by ID
const getById = async (id) => {
  try {
    const productId = parseInt(id);

    if (isNaN(productId) || productId <= 0) {
      return [new CustomResponse(400, 'Invalid product ID'), null];
    }

    const product = await prisma.product.findUnique({
      where: { product_id: productId },
      include: {
        category: {
          select: {
            category_id: true,
            name: true,
            created_at: true,
          },
        },
        productOrders: {
          include: {
            order: {
              include: {
                client: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return [new CustomResponse(404, 'Product not found'), null];
    }

    return [null, new CustomResponse(200, 'Product retrieved successfully', product)];
  } catch (error) {
    return [
      new CustomResponse(500, 'Failed to retrieve product', {
        error: error.message,
      }),
      null,
    ];
  }
};

// Update product by ID (partial update)
const update = async (id, data) => {
  try {
    const productId = parseInt(id);

    if (isNaN(productId) || productId <= 0) {
      return [new CustomResponse(400, 'Invalid product ID'), null];
    }

    // Validate the request data (partial update)
    const validation = validateSchema(UpdateProductSchema, data);

    if (!validation.success) {
      return [new CustomResponse(400, 'Validation failed', validation.error), null];
    }

    const validatedData = validation.data;

    // Set default image if provided but empty
    if (validatedData.image !== undefined && validatedData.image.trim() === '') {
      validatedData.image = 'https://via.placeholder.com/300x300?text=No+Image';
    }

    // Prevent modifying relation fields manually
    delete validatedData.parent_id;
    delete validatedData.sub_product;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { product_id: productId },
    });

    if (!existingProduct) {
      return [new CustomResponse(404, 'Product not found'), null];
    }

    // Check if reference is being updated and if it already exists
    if (validatedData.reference && validatedData.reference !== existingProduct.reference) {
      const referenceExists = await prisma.product.findFirst({
        where: {
          reference: validatedData.reference,
          product_id: { not: productId },
        },
      });

      if (referenceExists) {
        return [new CustomResponse(409, 'Product with this reference already exists'), null];
      }
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { product_id: productId },
      data: { ...validatedData, updated_at: new Date() },
    });

    return [null, new CustomResponse(200, 'Product updated successfully', updatedProduct)];
  } catch (error) {
    return [
      new CustomResponse(500, 'Failed to update product', {
        error: error.message,
      }),
      null,
    ];
  }
};

// 🔹 Helper function to restore parent values
async function restoreParent(tx, parentId, childUnitValue) {
  const parent = await tx.product.findUnique({
    where: { product_id: parentId },
  });

  if (!parent) return;

  const orig = parent.original_unit_value ?? parent.unit_value ?? 0;
  let restored = (parent.unit_value || 0) + (childUnitValue || 0);

  let addQuantity = 0;
  let newUnitValue = restored;

  if (orig > 0) {
    if (restored > orig) {
      addQuantity = Math.floor(restored / orig);
      newUnitValue = restored % orig;
    }

    if (newUnitValue === 0 && addQuantity > 0) {
      newUnitValue = 0;
    }
  }

  const updatedQuantity = (parent.quantity || 0) + addQuantity || 1;

  await tx.product.update({
    where: { product_id: parent.product_id },
    data: {
      quantity: updatedQuantity,
      unit_value: newUnitValue,
    },
  });
}

// 🔹 deleteProduct function
const deleteProduct = async (id) => {
  try {
    const productId = parseInt(id);

    if (isNaN(productId) || productId <= 0) {
      return [new CustomResponse(400, 'Invalid product ID'), null];
    }

    // Fetch product with relations
    const existingProduct = await prisma.product.findUnique({
      where: { product_id: productId },
      include: { parent: true, subProducts: true },
    });

    if (!existingProduct) {
      return [new CustomResponse(404, 'Product not found'), null];
    }

    // Check if product is used in any orders
    const productOrders = await prisma.productOrder.findFirst({
      where: { product_id: productId },
    });

    if (productOrders) {
      return [new CustomResponse(400, 'Product is used in orders'), null];
    }

    // If product is a main product and has subproducts → prevent deletion
    if (!existingProduct.parent_id && existingProduct.subProducts.length > 0) {
      return [
        new CustomResponse(400, 'Cannot delete a main product with existing sub-products'),
        null,
      ];
    }

    // Transaction: restore parent if needed then delete
    await prisma.$transaction(async (tx) => {
      if (existingProduct.parent_id) {
        await restoreParent(tx, existingProduct.parent_id, existingProduct.unit_value);
      }

      await tx.product.delete({
        where: { product_id: productId },
      });
    });

    return [null, new CustomResponse(200, 'Product deleted successfully')];
  } catch (error) {
    return [
      new CustomResponse(500, 'Failed to delete product', {
        error: error.message,
      }),
      null,
    ];
  }
};

const createSubProduct = async (data) => {
  const validation = validateSchema(CreateSubProductSchema, data);
  if (!validation.success) {
    return [
      new CustomResponse(400, 'Validation failed', {
        errors: validation.error,
        receivedData: data,
      }),
      null,
    ];
  }

  const { unit_value, reference } = validation.data;

  // Fetch the parent product by reference
  const parent = await prisma.product.findUnique({
    where: { reference },
  });

  if (!parent) {
    return [new CustomResponse(404, 'Parent product not found'), null];
  }

  // Validate that parent can have sub-products
  if (!parent.unit || !parent.unit_value || !parent.unit_price) {
    return [new CustomResponse(400, 'Parent product is not eligible for sub products'), null];
  }

  // Calculate total available units
  const totalAvailableUnits =
    parent.unit_value + (parent.quantity - 1) * parent.original_unit_value;

  if (totalAvailableUnits < unit_value) {
    return [new CustomResponse(400, 'Not enough unit_value available in parent'), null];
  }

  // Deduct the requested unit_value from the parent
  let remainingToDeduct = unit_value;
  let newQuantity = parent.quantity;
  let newUnitValue = parent.unit_value;

  if (remainingToDeduct <= newUnitValue) {
    // Case 1: requested amount is less than or equal to the remaining unit_value
    newUnitValue -= remainingToDeduct;

    // If unit_value reaches 0 → consume one full item and reset unit_value back to original_unit_value
    if (newUnitValue === 0 && newQuantity > 0) {
      newQuantity -= 1;
      newUnitValue = newQuantity === 0 ? 0 : parent.original_unit_value;
    }

    remainingToDeduct = 0;
  } else {
    // Case 2: requested amount is greater than the remaining unit_value in the current item
    remainingToDeduct -= newUnitValue;
    newQuantity -= 1;
    newUnitValue = newQuantity === 0 ? 0 : parent.original_unit_value; // reset to a full item

    // Calculate how many full items (original_unit_value) are needed
    const fullUnitsNeeded = Math.floor(remainingToDeduct / parent.original_unit_value);
    newQuantity -= fullUnitsNeeded;
    remainingToDeduct = remainingToDeduct % parent.original_unit_value;

    // If there is still a remainder, consume part of one more item

    if (remainingToDeduct > 0) {
      newUnitValue = parent.original_unit_value - remainingToDeduct;
      remainingToDeduct = 0;

      if (newUnitValue < 0) {
        newQuantity -= 1;
      }
    }
  }

  // Update the parent product
  await prisma.product.update({
    where: { product_id: parent.product_id },
    data: {
      quantity: newQuantity,
      unit_value: newUnitValue,
    },
  });

  // Generate a new reference for the sub product
  const newReference = generateReference();

  // Create the sub product with parent relation
  const subProduct = await prisma.product.create({
    data: {
      name: parent.name,
      category_id: parent.category_id,
      base_price: (parent.base_price * unit_value) / parent.original_unit_value,
      final_price: parent.unit_price * unit_value,
      status: parent.status,
      image: parent.image,
      unit: parent.unit,
      unit_price: parent.unit_price,
      unit_value: unit_value, // requested sub quantity
      original_unit_value: unit_value, // store original for sub as well
      sub_product: true,
      parent_id: parent.product_id, // <-- relation to parent
      reference: newReference,
      show_online: parent.show_online,
      expiration_date: parent.expiration_date,
      lot: parent.lot,
      quantity: 1,
    },
  });

  return [null, new CustomResponse(201, 'SubProduct created successfully', subProduct)];
};

const deleteMany = async (ids) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [new CustomResponse(400, 'ids must be a non-empty array of integers'), null];
    }

    const productIds = ids.map((id) => parseInt(id)).filter((n) => !isNaN(n) && n > 0);

    if (productIds.length !== ids.length) {
      return [new CustomResponse(400, 'ids must contain only positive integers'), null];
    }

    // Check if any of the products are used in orders
    const usedProducts = await prisma.productOrder.findMany({
      where: { product_id: { in: productIds } },
      select: { product_id: true },
    });

    if (usedProducts.length > 0) {
      const blockedIds = Array.from(new Set(usedProducts.map((p) => p.product_id)));
      return [new CustomResponse(400, 'Some products are used in orders', { blockedIds }), null];
    }

    // Fetch all products with relations
    const products = await prisma.product.findMany({
      where: { product_id: { in: productIds } },
      include: { parent: true, subProducts: true },
    });

    // Block deleting main products with subProducts
    const blockedMainIds = products
      .filter((p) => !p.parent_id && p.subProducts.length > 0)
      .map((p) => p.product_id);

    if (blockedMainIds.length > 0) {
      return [
        new CustomResponse(400, 'Cannot delete main products with existing sub-products', {
          blockedMainIds,
        }),
        null,
      ];
    }

    // 🔹 Transaction
    const result = await prisma.$transaction(async (tx) => {
      for (const product of products) {
        if (product.parent_id) {
          // Instead of duplicating, call restoreParent
          await restoreParent(tx, product.parent_id, product.unit_value);
        }

        // Delete product
        await tx.product.delete({
          where: { product_id: product.product_id },
        });
      }

      return { deletedCount: products.length };
    });

    return [null, new CustomResponse(200, 'Products deleted successfully', result)];
  } catch (error) {
    return [new CustomResponse(500, 'Failed to delete products', { error: error.message }), null];
  }
};

export default {
  create,
  getAll,
  getById,
  update,
  delete: deleteProduct,
  deleteMany,
  createSubProduct,
};
