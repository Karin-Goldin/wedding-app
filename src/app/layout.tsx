import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/registry";

const heebo = Heebo({ subsets: ["hebrew"] });

export const metadata: Metadata = {
  title: "Yehonatan & Adi - Wedding Album",
  description: "Share your wedding memories with us",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={heebo.className}>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
