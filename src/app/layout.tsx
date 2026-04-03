import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "@/components/providers/ThemeProvider";
import {ReactQueryProvider} from "@/components/providers/ReactQueryProvider";
import {AnchoredToastProvider, ToastProvider} from "@/components/coss-ui/toast";
import {Analytics} from "@vercel/analytics/react";
import {SpeedInsights} from "@vercel/speed-insights/next";

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
      <Analytics />
      <SpeedInsights />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          <ReactQueryProvider>
            <ToastProvider position="top-right">
              <AnchoredToastProvider>{children}</AnchoredToastProvider>
            </ToastProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
