import prisma from '../utils/prismaClient.js';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  validateSchema,
} from '../helpers/validate_schema.js';
import CustomResponse from '../helpers/customResponse.js';

// Create a new category
const create = async (data) => {
  const validation = validateSchema(CreateCategorySchema, data);
  if (!validation.success) {
    return [new CustomResponse(400, 'Validation failed', validation.error), null];
  }
  const validatedData = validation.data;

  const existingCategory = await prisma.category.findFirst({
    where: { name: validatedData.name },
  });
  if (existingCategory) {
    return [new CustomResponse(409, 'Category with this name already exists'), null];
  }
  const newCategory = await prisma.category.create({
    data: validatedData,
  });
  return [null, new CustomResponse(201, 'Category created successfully', newCategory)];
};

// Get all categories with optional filtering
const getAll = async (query) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'category_id', sortOrder = 'asc' } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (search) {
      where.name = { contains: search };
    }

    // Get categories with pagination
    const [categories, totalCount] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          products: {
            select: {
              product_id: true,
              name: true,
              reference: true,
            },
          },
        },
      }),
      prisma.category.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / take);

    return [
      null,
      new CustomResponse(200, 'Categories retrieved successfully', {
        categories,
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
      new CustomResponse(500, 'Failed to retrieve categories', {
        error: error.message,
      }),
      null,
    ];
  }
};

// Get category by ID
const getById = async (id) => {
  try {
    const categoryId = parseInt(id);

    if (isNaN(categoryId) || categoryId <= 0) {
      return [new CustomResponse(400, 'Invalid category ID'), null];
    }

    const category = await prisma.category.findUnique({
      where: { category_id: categoryId },
      include: {
        products: {
          select: {
            product_id: true,
            name: true,
            reference: true,
            base_price: true,
            final_price: true,
            status: true,
            quantity: true,
          },
        },
      },
    });

    if (!category) {
      return [new CustomResponse(404, 'Category not found'), null];
    }

    return [null, new CustomResponse(200, 'Category retrieved successfully', category)];
  } catch (error) {
    return [
      new CustomResponse(500, 'Failed to retrieve category', {
        error: error.message,
      }),
      null,
    ];
  }
};

// Update category by ID
const update = async (id, data) => {
  try {
    const categoryId = parseInt(id);

    if (isNaN(categoryId) || categoryId <= 0) {
      return [new CustomResponse(400, 'Invalid category ID'), null];
    }

    // Validate the request data
    const validation = validateSchema(UpdateCategorySchema, data);

    if (!validation.success) {
      return [new CustomResponse(400, 'Validation failed', validation.error), null];
    }

    const validatedData = validation.data;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { category_id: categoryId },
    });

    if (!existingCategory) {
      return [new CustomResponse(404, 'Category not found'), null];
    }

    // Check if name is being updated and if it already exists
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameExists = await prisma.category.findFirst({
        where: {
          name: validatedData.name,
          category_id: { not: categoryId },
        },
      });

      if (nameExists) {
        return [new CustomResponse(409, 'Category with this name already exists'), null];
      }
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { category_id: categoryId },
      data: validatedData,
    });

    return [null, new CustomResponse(200, 'Category updated successfully', updatedCategory)];
  } catch (error) {
    return [
      new CustomResponse(500, 'Failed to update category', {
        error: error.message,
      }),
      null,
    ];
  }
};

// Delete category by ID
const deleteCategory = async (id) => {
  try {
    const categoryId = parseInt(id);

    if (isNaN(categoryId) || categoryId <= 0) {
      return [new CustomResponse(400, 'Invalid category ID'), null];
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { category_id: categoryId },
    });

    if (!existingCategory) {
      return [new CustomResponse(404, 'Category not found'), null];
    }

    // Check if category has any products
    const categoryProducts = await prisma.product.findFirst({
      where: { category_id: categoryId },
    });

    if (categoryProducts) {
      return [new CustomResponse(400, 'Cannot delete category with existing products'), null];
    }

    // Delete the category
    await prisma.category.delete({
      where: { category_id: categoryId },
    });

    return [null, new CustomResponse(200, 'Category deleted successfully')];
  } catch (error) {
    return [
      new CustomResponse(500, 'Failed to delete category', {
        error: error.message,
      }),
      null,
    ];
  }
};

export default {
  create,
  getAll,
  getById,
  update,
  delete: deleteCategory,
};
