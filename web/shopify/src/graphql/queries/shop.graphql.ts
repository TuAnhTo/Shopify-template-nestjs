export const GET_SHOP = `
  query getShop {
    shop {
      id
      name
      primaryDomain {
        host
      }
      myshopifyDomain
      contactEmail
      currencyCode
      ianaTimezone
      plan {
        displayName
      }
      description
      billingAddress {
        country
        province
        city
      }
      createdAt
      updatedAt
    }
  }
`;
