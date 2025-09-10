import prisma from '../utils/prismaClient.js';
import CustomResponse from '../helpers/customResponse.js';

const getAllProductCategories = async (query) => {
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

    const options = categories.map((category) => ({
      value: category.category_id,
      label: category.name,
    }));

    return [
      null,
      new CustomResponse(200, 'Categories retrieved successfully', {
        // options,
        data: options,
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

const getAllClients = async (query) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'client_id', sortOrder = 'asc' } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch clients with pagination
    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          phoneNumbers: {
            select: {
              phone_number: true,
              is_primary: true,
            },
          },
          addresses: {
            select: {
              street: true,
              city: true,
              country: true,
              is_primary: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / take);

    // Map into options format
    const options = clients.map((client) => ({
      value: client.client_id,
      label: `${client.first_name} ${client.last_name}`,
      email: client.email,
      company: client.company,
      phones: client.phoneNumbers,
      addresses: client.addresses,
    }));

    return [
      null,
      new CustomResponse(200, 'Clients retrieved successfully', {
        data: options,
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
      new CustomResponse(500, 'Failed to retrieve clients', {
        error: error.message,
      }),
      null,
    ];
  }
};

export default {
  getAllProductCategories,
  getAllClients,
};
