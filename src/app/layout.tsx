import type { Metadata } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import "./site.css";
import { SalesChat } from "@/components/sales-chat/sales-chat";
import { SnitcherTracker } from "@/components/analytics/snitcher-tracker";
import { Tracker } from "@/components/analytics/tracker";

const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WildcatIQ | AI for independent oil & gas companies",
  description:
    "WildcatIQ runs production, field operations, documents and regulatory work for independent oil and gas operators, with an assistant that already knows the business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SalesChat />
        <Tracker />
        <SnitcherTracker />
      </body>
    </html>
  );
}
