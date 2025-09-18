export const ROUTES = {
  HOME: "/",
  PRODUCTS: "/products",
  PAGE_NAME: "/pagename",
  NOT_FOUND: "/notfound",
  EXIT_IFRAME: "/exitiframe",
} as const;

export const NAVIGATION_ITEMS = [
  {
    label: "Home",
    url: ROUTES.HOME,
  },
  {
    label: "Products",
    url: ROUTES.PRODUCTS,
  },
] as const;
