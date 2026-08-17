import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { SiteDataProvider } from "@/lib/store";
import { siteConfig } from "@/data/site";
import SiteHeadInject from "@/components/SiteHeadInject";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.tagline,
};

export const viewport: Viewport = {
  themeColor: "#f47216",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body style={{ fontFamily: "var(--font-poppins), Poppins, sans-serif" }}>
        <SiteDataProvider>
          <SiteHeadInject />
          {children}
        </SiteDataProvider>
      </body>
    </html>
  );
}
