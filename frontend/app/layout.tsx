import type { Metadata } from "next";
import { Outfit, Space_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "NyayaSetu – AI-Powered Indian Legal Assistant",
  description: "Democratizing legal awareness in India. Query legal rights, browse the BNS, BNSS, BSA, or upload documents to get contextual AI answers.",
  keywords: "NyayaSetu, legal AI, India law, RAG legal, BNS, BNSS, BSA, Constitution of India, legal documents RAG",
  openGraph: {
    title: "NyayaSetu – AI-Powered Indian Legal Assistant",
    description: "Bridging Citizens and Justice Through Artificial Intelligence.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", "h-full", "antialiased", outfit.variable, spaceMono.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
