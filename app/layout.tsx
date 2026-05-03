import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/locale";
import { LocaleBar } from "@/components/LocaleBar";

export const metadata: Metadata = {
  title: "Flight Price Tracker",
  description: "Track flight prices and get notified when fares drop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <LocaleProvider>
          <LocaleBar />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
