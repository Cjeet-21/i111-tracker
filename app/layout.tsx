import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "i111 Tracker",
    template: "%s · i111 Tracker",
  },
  description:
    "Track coding problem practice with i111 spaced-repetition revisions: Immediate, 1 Day, 1 Week, 1 Month.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
