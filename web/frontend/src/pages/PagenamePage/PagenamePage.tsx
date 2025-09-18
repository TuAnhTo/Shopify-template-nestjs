import { Card, Page, Layout } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

export function PagenamePage() {
  const { t } = useTranslation();

  return (
    <Page narrowWidth>
      <TitleBar title={t("PageName.title")} />
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <h1>{t("PageName.heading")}</h1>
            <p>{t("PageName.description")}</p>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
