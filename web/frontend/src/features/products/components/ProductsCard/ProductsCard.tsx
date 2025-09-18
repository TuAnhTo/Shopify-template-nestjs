import { Card, TextContainer, Text } from "@shopify/polaris";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks";
import { DEFAULT_PRODUCTS_COUNT } from "@/constants";

export function ProductsCard() {
  const { t } = useTranslation();
  const { count, isLoading, createProducts, isCreating } = useProducts();

  return (
    <Card
      title={t("ProductsCard.title")}
      sectioned
      primaryFooterAction={{
        content: t("ProductsCard.populateProductsButton", {
          count: DEFAULT_PRODUCTS_COUNT,
        }),
        onAction: createProducts,
        loading: isCreating,
      }}
    >
      <TextContainer spacing="loose">
        <p>{t("ProductsCard.description")}</p>
        <Text as="h4" variant="headingMd">
          {t("ProductsCard.totalProductsHeading")}
          <Text variant="bodyMd" as="p" fontWeight="semibold">
            {isLoading ? "-" : count}
          </Text>
        </Text>
      </TextContainer>
    </Card>
  );
}
