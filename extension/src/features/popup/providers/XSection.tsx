import { ProviderConnectionSection } from "../components/ProviderConnectionSection";
import type { ProviderSectionProps } from "./providers";

const X_LOGIN_URL = "https://x.com/login";

export function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.633 5.903-5.633Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function XSection(props: ProviderSectionProps) {
  return (
    <ProviderConnectionSection
      {...props}
      name="X"
      description="Sign in to X to enable sync"
      connectLabel="Log in to X"
      connectHref={X_LOGIN_URL}
    />
  );
}
