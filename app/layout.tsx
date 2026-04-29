import type { Metadata } from "next";
import { Inter, Geist } from 'next/font/google'
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/global/theme-provider";
import { Analytics } from '@vercel/analytics/next';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })


export const metadata: Metadata = {
  title: "Sahaya",
  description:
    "A need-to-response intelligence layer for NGOs. Cross-channel intake, AI triage, volunteer matching, and closed-loop accountability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", inter.className, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
