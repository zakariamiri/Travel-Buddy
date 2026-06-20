import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Epilogue } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner"
import { LanguageProvider } from "@/components/LanguageProvider";


const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const epilogue = Epilogue({
  subsets: ["latin"],
  variable: "--font-heading",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travel-Buddy | Plan Trips Together",
  description:
    "Plan group trips, vote on activities, manage budgets and track expenses with Travel-Buddy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        plusJakartaSans.variable,
        geistMono.variable,
        epilogue.variable,
        "font-sans"
      )}
      
    >
      <head>
        {/* Remix Icon CDN */}
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css"
          rel="stylesheet"
        />
        <link rel="icon" href="/logo.png" sizes="any" />
      </head>

      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          {children}
          <Toaster  position="bottom-right"  />
        </LanguageProvider>
      </body>
    </html>
  );
}
