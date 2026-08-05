import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { ToastProvider } from "@/components/ui/toast";
import { SaveToastApp } from "@/features/content/SaveToastApp";
import "@/assets/save-toast.css";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "tobira-save-toast",
      position: "overlay",
      alignment: "top-right",
      zIndex: 2_147_483_647,
      onMount(container, shadow) {
        const root = ReactDOM.createRoot(container);
        root.render(
          <StrictMode>
            <ToastProvider
              position="top-right"
              portalProps={{ container: shadow }}
            >
              <SaveToastApp />
            </ToastProvider>
          </StrictMode>,
        );
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    ui.mount();
    elevateToastHost(ui.shadowHost);
  },
});

function elevateToastHost(host: HTMLElement): void {
  host.style.setProperty("position", "fixed", "important");
  host.style.setProperty("inset", "0", "important");
  host.style.setProperty("width", "100vw", "important");
  host.style.setProperty("height", "100vh", "important");
  host.style.setProperty("margin", "0", "important");
  host.style.setProperty("padding", "0", "important");
  host.style.setProperty("border", "0", "important");
  host.style.setProperty("background", "transparent", "important");
  host.style.setProperty("pointer-events", "none", "important");
  host.style.setProperty("z-index", "2147483647", "important");

  if (!("showPopover" in host)) return;

  host.setAttribute("popover", "manual");

  try {
    host.showPopover();
  } catch {
    // Keep the max z-index fallback when the page blocks popover promotion.
  }
}
