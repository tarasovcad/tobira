import { ProviderConnectionSection } from "../components/ProviderConnectionSection";
import type { ProviderSectionProps } from "./providers";

export function ChromeSection(props: ProviderSectionProps) {
  return (
    <ProviderConnectionSection
      {...props}
      name="Chrome"
      description="Connect Chrome to import your bookmarks"
      connectLabel="Connect Chrome"
    />
  );
}
