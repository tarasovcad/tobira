import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "@/components/providers/ThemeProvider";
import {ReactQueryProvider} from "@/components/providers/ReactQueryProvider";
import {AnchoredToastProvider, ToastProvider} from "@/components/ui/coss/toast";
import {Analytics} from "@vercel/analytics/react";
import {SpeedInsights} from "@vercel/speed-insights/next";
import {NuqsAdapter} from "nuqs/adapters/next/app";
import Script from "next/script";

const inter = Inter({subsets: ["latin"], variable: "--font-sans"});

export const metadata: Metadata = {
  title: "Tobira - Visual Bookmark & Knowledge Manager",
  description:
    "Save links, media and ideas in one place. Tobira automatically organizes your bookmarks so you can find inspiration, tools and knowledge instantly.",
  icons: {
    icon: "/logo/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <body>
        <Script src="http://localhost:3001/api/script.js" data-site-id="24e4864af7f4" defer />
        <Analytics />
        <SpeedInsights />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          <ReactQueryProvider>
            <ToastProvider position="top-right">
              <NuqsAdapter>
                <AnchoredToastProvider>{children}</AnchoredToastProvider>
              </NuqsAdapter>
            </ToastProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
