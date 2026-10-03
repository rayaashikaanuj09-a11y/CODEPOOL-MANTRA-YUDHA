import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NovaMart TrustDesk — Governed AI Customer Support Control Plane",
  description: "Verification-first AI support agent with deterministic Action Firewall, Policy Time Machine, and Decision Receipt governance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-coral-500/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
