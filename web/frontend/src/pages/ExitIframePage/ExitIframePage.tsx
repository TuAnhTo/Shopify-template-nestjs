import { Page, Layout, Card, Spinner } from "@shopify/polaris";
import { useTranslation } from "react-i18next";

export function ExitIframePage() {
  const { t } = useTranslation();

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <Spinner size="large" />
              <p style={{ marginTop: "1rem" }}>{t("ExitIframe.description")}</p>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
