export const GET_ORDERS = `
  query getOrders($first: Int!) {
    orders(first: $first) {
      nodes {
        id
        name
        customer {
          displayName
          email
        }
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        displayFulfillmentStatus
        displayFinancialStatus
        processedAt
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_ORDER_BY_ID = `
  query getOrder($id: ID!) {
    order(id: $id) {
      id
      name
      customer {
        displayName
        email
      }
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      displayFulfillmentStatus
      displayFinancialStatus
      processedAt
      createdAt
      updatedAt
    }
  }
`;
