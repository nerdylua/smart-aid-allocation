import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Space_Grotesk } from "next/font/google";
import SmoothScroll from "@/components/landing/SmoothScroll";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sahaya",
  description:
    "AI-powered community need intelligence grid. Transform scattered aid signals into prioritized, equitable responses - from intake to verified closure.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-full antialiased ${GeistSans.variable} ${spaceGrotesk.variable}`}>
      <SmoothScroll />
      {children}
    </div>
  );
}
