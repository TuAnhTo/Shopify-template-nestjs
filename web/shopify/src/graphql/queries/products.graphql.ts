export const GET_PRODUCTS = `
  query getProducts($first: Int!) {
    products(first: $first) {
      nodes {
        id
        title
        handle
        status
        vendor
        productType
        tags
        priceRangeV2 {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        totalInventory
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_PRODUCT_BY_ID = `
  query getProduct($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      status
      vendor
      productType
      tags
      description
      priceRangeV2 {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      totalInventory
      createdAt
      updatedAt
    }
  }
`;
