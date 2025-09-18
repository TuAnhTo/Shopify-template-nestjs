import { Card, Page, Layout, Link } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/constants";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <Page narrowWidth>
      <TitleBar title={t("NotFound.title")} />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <h1>{t("NotFound.heading")}</h1>
            <p>{t("NotFound.description")}</p>
            <Link url={ROUTES.HOME}>{t("NotFound.linkText")}</Link>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
