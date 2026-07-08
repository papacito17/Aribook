import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ari Books — Modern Cloud Accounting for US Businesses",
  description:
    "Automated bank feeds, real-time US GAAP reports, and automated sales tax. The accounting platform built to replace QuickBooks.",
};

/** Applies the saved theme before first paint to prevent a flash. */
const themeScript = `
try {
  const t = localStorage.getItem("theme");
  if (t === "dark" || (!t && matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
} catch {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
