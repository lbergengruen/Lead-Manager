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
            <span className="navTitle">Lead Manager</span>
            <Link className="navLink" href="/">
              Home
            </Link>
            <Link className="navLink" href="/leads">
              Leads
            </Link>
            <Link className="navLink" href="/reminders">
              Reminders
            </Link>
            <Link className="navLink" href="/cadences">
              Cadences
            </Link>
            <Link className="navLink" href="/licenses">
              Licenses
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
