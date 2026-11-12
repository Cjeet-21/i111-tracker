import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const DESCRIPTION =
  "Track coding problem practice with i111 spaced-repetition revisions: Immediate, 1 Day, 1 Week, 1 Month.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "i111 Tracker",
    template: "%s · i111 Tracker",
  },
  description: DESCRIPTION,
  applicationName: "i111 Tracker",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "i111 Tracker",
    title: "i111 Tracker — spaced repetition for coding practice",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: "i111 Tracker — spaced repetition for coding practice",
    description: DESCRIPTION,
  },
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
