import type {Metadata, Viewport} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import React from "react";
import Script from "next/script";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
    title: "LoadLink",
    description: "Track shared laundry machines, idle times, and notifications.",
    manifest: "/manifest.json",
    icons: {
        icon: [
            { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ],
        apple: "/icons/icon-192.png"
    }
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: [
        { color: "#111827", media: "(prefers-color-scheme: dark)" },
        { color: "#ffffff", media: "(prefers-color-scheme: light)" }
    ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <head>
            <meta name="mobile-web-app-capable" content="yes"/>
            <meta name="mobile-web-app-status-bar-style" content="black-translucent"/>
            <title>LoadLink</title>
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh bg-white text-gray-900`}>
        <Script id="sw-register" strategy="afterInteractive">
            {`
                if ('serviceWorker' in navigator) {
                  const register = () => {
                    navigator.serviceWorker.register('/sw.js', { scope: '/' })
                      .then(r => console.log('SW registered:', r.scope))
                      .catch(err => console.error('SW register failed:', err));
                  };
                  if (document.readyState === 'complete') register();
                  else window.addEventListener('load', register, { once: true });
                }
              `}
        </Script>
        {children}
        </body>
        </html>
    );
}
