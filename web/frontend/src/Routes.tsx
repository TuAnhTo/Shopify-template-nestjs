import { Routes as ReactRouterRoutes, Route } from "react-router-dom";
import { HomePage, NotFoundPage, ExitIframePage, PagenamePage } from "@/pages";
import { ROUTES } from "@/constants";

interface RouteConfig {
  path: string;
  component: React.ComponentType;
}

const routes: RouteConfig[] = [
  { path: ROUTES.HOME, component: HomePage },
  { path: ROUTES.PAGE_NAME, component: PagenamePage },
  { path: ROUTES.EXIT_IFRAME, component: ExitIframePage },
];

/**
 * Application routing configuration
 * File-based routing using React Router
 */
export function Routes() {
  return (
    <ReactRouterRoutes>
      {routes.map(({ path, component: Component }) => (
        <Route key={path} path={path} element={<Component />} />
      ))}
      <Route path="*" element={<NotFoundPage />} />
    </ReactRouterRoutes>
  );
}
