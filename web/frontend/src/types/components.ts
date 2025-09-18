import { ReactNode } from "react";

export interface BaseComponentProps {
  children?: ReactNode;
  className?: string;
}

export interface ProviderProps extends BaseComponentProps {
  children: ReactNode;
}

export interface PageProps {
  title?: string;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  sectioned?: boolean;
  primaryFooterAction?: {
    content: string;
    onAction: () => void;
    loading?: boolean;
  };
}

export interface LinkProps {
  url: string;
  external?: boolean;
  children: ReactNode;
}
