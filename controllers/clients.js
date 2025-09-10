import prisma from '../utils/prismaClient.js';
import {
  CreateClientSchema,
  UpdateClientSchema,
  validateSchema,
} from '../helpers/validate_schema.js';
import CustomResponse from '../helpers/customResponse.js';

// Create a new client
const create = async (data) => {
  try {
    // Validate data
    const validation = validateSchema(CreateClientSchema, data);
    if (!validation.success) {
      return [new CustomResponse(400, 'Validation failed', validation.error), null];
    }
    const validatedData = validation.data;

    // Check for existing email
    const existingClient = await prisma.client.findFirst({
      where: { email: validatedData.email },
    });
    if (existingClient) {
      return [new CustomResponse(409, 'Client with this email already exists'), null];
    }

    // Prepare nested create for addresses and phoneNumbers
    const clientData = {
      ...validatedData,
      addresses: {
        create: (validatedData.addresses || []).map((a) => ({
          street: a.street,
          city: a.city,
          state: a.state,
          postal_code: a.postal_code,
          country: a.country,
          is_primary: a.is_primary ?? false,
        })),
      },
      phoneNumbers: {
        create: (validatedData.phoneNumbers || []).map((p) => ({
          phone_number: p.phone_number,
          phone_type: p.phone_type,
          is_primary: p.is_primary ?? false,
        })),
      },
    };

    // Create client with nested data
    const newClient = await prisma.client.create({
      data: clientData,
      include: {
        addresses: true,
        phoneNumbers: true,
      },
    });

    return [null, new CustomResponse(201, 'Client created successfully', newClient)];
  } catch (error) {
    return [new CustomResponse(500, 'Failed to create client', { error: error.message }), null];
  }
};

// Get all clients with optional filtering
const getAll = async (query) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      active,
      company,
      sortBy = 'client_id',
      sortOrder = 'asc',
    } = query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
      ];
    }

    if (company) {
      where.company = { contains: company };
    }

    if (active !== undefined) {
      where.active = active === 'true';
    }

    // Get clients with pagination
    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          orders: {
            select: {
              order_id: true,
              total_price: true,
            },
          },
          addresses: true,
          phoneNumbers: true,
        },
      }),
      prisma.client.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / take);

    return [
      null,
      new CustomResponse(200, 'Clients retrieved successfully', {
        clients,
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

// Get client by ID
const getById = async (id) => {
  try {
    const clientId = parseInt(id);

    if (isNaN(clientId) || clientId <= 0) {
      return [new CustomResponse(400, 'Invalid client ID'), null];
    }

    const client = await prisma.client.findUnique({
      where: { client_id: clientId },
      include: {
        orders: {
          include: {
            orders: {
              include: {
                productOrders: {
                  include: {
                    product: {
                      select: {
                        product_id: true,
                        name: true,
                        reference: true,
                        final_price: true,
                      },
                    },
                  },
                },
              },
            },
            addresses: true,
            phoneNumbers: true,
          },
        },
      },
    });

    if (!client) {
      return [new CustomResponse(404, 'Client not found'), null];
    }

    return [null, new CustomResponse(200, 'Client retrieved successfully', client)];
  } catch (error) {
    return [
      new CustomResponse(500, 'Failed to retrieve client', {
        error: error.message,
      }),
      null,
    ];
  }
};

// Update client by ID
const update = async (id, data) => {
  try {
    const clientId = parseInt(id);

    if (isNaN(clientId) || clientId <= 0) {
      return [new CustomResponse(400, 'Invalid client ID'), null];
    }

    // Validate the request data
    const validation = validateSchema(UpdateClientSchema, data);

    if (!validation.success) {
      return [new CustomResponse(400, 'Validation failed', validation.error), null];
    }

    const validatedData = validation.data;

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { client_id: clientId },
      include: { addresses: true, phoneNumbers: true },
    });

    if (!existingClient) {
      return [new CustomResponse(404, 'Client not found'), null];
    }

    // Check email uniqueness
    if (validatedData.email && validatedData.email !== existingClient.email) {
      const emailExists = await prisma.client.findFirst({
        where: {
          email: validatedData.email,
          client_id: { not: clientId },
        },
      });
      if (emailExists) {
        return [new CustomResponse(409, 'Client with this email already exists'), null];
      }
    }

    // Update addresses
    if (validatedData.addresses) {
      // Delete addresses that are not in the updated list
      const updatedAddressIds = validatedData.addresses
        .filter((a) => a.address_id)
        .map((a) => a.address_id);

      await prisma.address.deleteMany({
        where: {
          client_id: clientId,
          address_id: { notIn: updatedAddressIds },
        },
      });

      // Upsert addresses
      for (const a of validatedData.addresses) {
        if (a.address_id) {
          await prisma.address.update({
            where: { address_id: a.address_id },
            data: { ...a },
          });
        } else {
          await prisma.address.create({
            data: { ...a, client_id: clientId },
          });
        }
      }
    }

    // Update phoneNumbers
    if (validatedData.phoneNumbers) {
      const updatedPhoneIds = validatedData.phoneNumbers
        .filter((p) => p.phone_id)
        .map((p) => p.phone_id);

      await prisma.phoneNumber.deleteMany({
        where: {
          client_id: clientId,
          phone_id: { notIn: updatedPhoneIds },
        },
      });

      for (const p of validatedData.phoneNumbers) {
        if (p.phone_id) {
          await prisma.phoneNumber.update({
            where: { phone_id: p.phone_id },
            data: { ...p },
          });
        } else {
          await prisma.phoneNumber.create({
            data: { ...p, client_id: clientId },
          });
        }
      }
    }

    // Update client basic info
    const { addresses, phoneNumbers, ...clientData } = validatedData;

    const updatedClient = await prisma.client.update({
      where: { client_id: clientId },
      data: clientData,
      include: { addresses: true, phoneNumbers: true },
    });

    return [null, new CustomResponse(200, 'Client updated successfully', updatedClient)];
  } catch (error) {
    return [new CustomResponse(500, 'Failed to update client', { error: error.message }), null];
  }
};

// Delete client by ID
const deleteClient = async (id) => {
  try {
    const clientId = parseInt(id);

    if (isNaN(clientId) || clientId <= 0) {
      return [new CustomResponse(400, 'Invalid client ID'), null];
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { client_id: clientId },
    });

    if (!existingClient) {
      return [new CustomResponse(404, 'Client not found'), null];
    }

    // Check if client has any orders
    const clientOrders = await prisma.order.findFirst({
      where: { client_id: clientId },
    });

    if (clientOrders) {
      return [new CustomResponse(400, 'Cannot delete client with existing orders'), null];
    }

    // Delete the client
    await prisma.client.delete({
      where: { client_id: clientId },
    });

    return [null, new CustomResponse(200, 'Client deleted successfully')];
  } catch (error) {
    return [
      new CustomResponse(500, 'Failed to delete client', {
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
  delete: deleteClient,
};
