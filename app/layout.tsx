import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Call Evaluation System | AI Grader",
  description: "AI-powered call evaluator scoring kick-off and coaching calls against rubrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased text-[#1A1A1E] bg-[#FAF8F5]">
        {children}
      </body>
    </html>
  );
}
