import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Chrome from "@/components/Chrome";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://slate.tools"),
  title: {
    default: "Slate — the terminal that shows its work",
    template: "%s — Slate",
  },
  description:
    "Slate runs your shell in one pane and puts the right view in the other — spec, diff, tree — the moment your agent touches a file. Native, local, free.",
  openGraph: {
    type: "website",
    siteName: "Slate",
    title: "Slate — the terminal that shows its work",
    description:
      "A second pane that switches itself. Spec when the agent writes a spec. Diff when it edits code. Tree when it moves files.",
    images: ["/demo/slate-ad-poster.jpg"],
  },
  twitter: { card: "summary_large_image", images: ["/demo/slate-ad-poster.jpg"] },
};

export const viewport: Viewport = { themeColor: "#131313", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <div className="backdrop" aria-hidden="true">
          <div className="glow" />
          <div className="grid" />
        </div>
        <Chrome />
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
