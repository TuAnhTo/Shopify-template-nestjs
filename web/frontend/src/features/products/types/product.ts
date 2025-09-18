export interface Product {
  id: string;
  title: string;
  handle?: string;
  description?: string;
  vendor?: string;
  status?: "active" | "archived" | "draft";
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductInput {
  title: string;
  description?: string;
  vendor?: string;
  status?: "active" | "archived" | "draft";
}

export interface ProductsQueryVariables {
  first?: number;
  after?: string;
  query?: string;
}

export interface ProductsConnection {
  edges: Array<{
    node: Product;
    cursor: string;
  }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
}

export interface ProductsCount {
  count: number;
}
