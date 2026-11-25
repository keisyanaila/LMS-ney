
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const heading = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoboLearn | Learning Management System",
  description: "RoboLearn — belajar lebih cerdas, bersama robot yang ramah.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${body.variable} ${heading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
