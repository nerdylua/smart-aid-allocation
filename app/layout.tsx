import type { Metadata } from "next";
import { Inter, Geist } from 'next/font/google'
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/global/theme-provider";
import { Analytics } from '@vercel/analytics/next';
import Script from "next/script";

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
        <Script id='clarity' strategy='afterInteractive'>
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wjor4iygs1");
          `}
        </Script>
      </body>
    </html>
  );
}
