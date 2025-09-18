import { BrowserRouter } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavMenu } from "@shopify/app-bridge-react";
import { Routes } from "./Routes";
import { AppProviders } from "@/providers";
import { ROUTES } from "@/constants";

export default function App() {
  const { t } = useTranslation();

  return (
    <AppProviders>
      <BrowserRouter>
        <NavMenu>
          <a href={ROUTES.HOME} rel="home" />
          <a href={ROUTES.PAGE_NAME}>{t("NavigationMenu.pageName")}</a>
        </NavMenu>
        <Routes />
      </BrowserRouter>
    </AppProviders>
  );
}
