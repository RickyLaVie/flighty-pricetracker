import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/lib/locale";
import { Header } from "@/components/Header";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Flighty — Flight Price Tracker",
  description: "Track flight prices and get notified when fares drop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <LocaleProvider>
          <Header />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
