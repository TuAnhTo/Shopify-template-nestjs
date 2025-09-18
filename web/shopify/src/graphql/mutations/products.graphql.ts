export const CREATE_PRODUCT = `
  mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
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
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_PRODUCT = `
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
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
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_PRODUCT = `
  mutation productDelete($input: ProductDeleteInput!) {
    productDelete(input: $input) {
      deletedProductId
      userErrors {
        field
        message
      }
    }
  }
`;
