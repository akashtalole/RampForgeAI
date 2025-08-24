import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RampForgeAI",
  description: "AI-powered developer onboarding platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-inter antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <RouteGuard>
              {children}
            </RouteGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
