import type { Metadata } from "next";

import { ModeProvider } from "@/contexts/ModeProvider";

import Header from "./containers/Header";
import AuthWrapper from "./containers/AuthWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manhattan My Way",
  description: "Manhattan My Way is an interactive mapping tool that allows users to explore and select the most sustainable routes in Manhattan based on green space, busyness and air quality",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ModeProvider>
          <AuthWrapper>
            <main className="min-h-dvh flex flex-col">
            {/* put Header here */}
            <Header />
            {children}
            {/* put Footer here */}
            </main>
          </AuthWrapper>
        </ModeProvider>
      </body>
    </html>
  );
}
