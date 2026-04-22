import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Manager",
  description: "Lead Manager"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <div className="navInner">
            <Link className="navTitle" href="/board">
              Lead Manager
            </Link>
            <Link className="navLink" href="/board">
              Board
            </Link>
            <Link className="navLink" href="/strategies">
              Strategies
            </Link>
            <Link className="navLink" href="/settings">
              Settings
            </Link>
          </div>
        </header>
        <main>{children}</main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
