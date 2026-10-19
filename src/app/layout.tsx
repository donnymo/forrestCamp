import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Caveat, Geist, Kaushan_Script, Montserrat } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ScenarioPanel } from "@/components/ScenarioPanel";
import { SiteHeader } from "@/components/SiteHeader";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });
// Montserrat и Caveat — вариативные шрифты: одно подключение покрывает все начертания.
const montserrat = Montserrat({ subsets: ["latin", "cyrillic"], variable: "--font-heading" });
// Рукописные надзаголовки секций.
const caveat = Caveat({ subsets: ["latin", "cyrillic"], variable: "--font-script" });
// Только для названия Forest Camp.
const kaushan = Kaushan_Script({ subsets: ["latin"], weight: "400", variable: "--font-brand" });

export const metadata: Metadata = {
  title: { default: "Forest Camp — прокат палаток, сапбордов и снаряжения", template: "%s · Forest Camp" },
  description:
    "Аренда палаток, сапбордов и туристического снаряжения на несколько дней. Наличие на ваши даты и прозрачная стоимость.",
};

// Цвет строки состояния мобильного браузера — под белую шапку.
export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      className={cn("font-sans", geist.variable, montserrat.variable, caveat.variable, kaushan.variable)}
    >
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <CartProvider>
            <SiteHeader />
            <main className="flex w-full flex-1 flex-col">{children}</main>
            <ScenarioPanel />
            <Toaster theme="light" position="bottom-right" />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
