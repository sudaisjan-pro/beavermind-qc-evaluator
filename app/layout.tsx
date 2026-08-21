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
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
