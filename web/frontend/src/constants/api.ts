export const API_ENDPOINTS = {
  PRODUCTS: {
    COUNT: "/api/products/count",
    CREATE: "/api/products",
    LIST: "/api/products",
  },
} as const;

export const DEFAULT_PRODUCTS_COUNT = 5;

export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
