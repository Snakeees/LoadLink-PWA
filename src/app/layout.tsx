import type {Metadata, Viewport} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import React from "react";
import Script from "next/script";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
    title: "LoadLink",
    description: "Track shared laundry [[...slug]], idle times, and notifications.",
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
            <link rel="apple-touch-icon" href="/icons/apple-icon-180.png"/>

            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2048-2732.jpeg"
                  media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2732-2048.jpeg"
                  media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1668-2388.jpeg"
                  media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2388-1668.jpeg"
                  media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1536-2048.jpeg"
                  media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2048-1536.jpeg"
                  media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1640-2360.jpeg"
                  media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2360-1640.jpeg"
                  media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1668-2224.jpeg"
                  media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2224-1668.jpeg"
                  media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1620-2160.jpeg"
                  media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2160-1620.jpeg"
                  media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1488-2266.jpeg"
                  media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2266-1488.jpeg"
                  media="(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1320-2868.jpeg"
                  media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2868-1320.jpeg"
                  media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1206-2622.jpeg"
                  media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2622-1206.jpeg"
                  media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1260-2736.jpeg"
                  media="(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2736-1260.jpeg"
                  media="(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1290-2796.jpeg"
                  media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2796-1290.jpeg"
                  media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1179-2556.jpeg"
                  media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2556-1179.jpeg"
                  media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1170-2532.jpeg"
                  media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2532-1170.jpeg"
                  media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1284-2778.jpeg"
                  media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2778-1284.jpeg"
                  media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1125-2436.jpeg"
                  media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2436-1125.jpeg"
                  media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1242-2688.jpeg"
                  media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2688-1242.jpeg"
                  media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-828-1792.jpeg"
                  media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1792-828.jpeg"
                  media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1242-2208.jpeg"
                  media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-2208-1242.jpeg"
                  media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-750-1334.jpeg"
                  media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1334-750.jpeg"
                  media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-640-1136.jpeg"
                  media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"/>
            <link rel="apple-touch-startup-image" href="/icons/apple-splash-1136-640.jpeg"
                  media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"/>

            <meta name="mobile-web-app-capable" content="yes"/>
            <meta name="mobile-web-app-status-bar-style" content="black-translucent"/>
            <link rel="manifest" href="/manifest.json"/>
            <meta name="theme-color" content="#0a0a0a"/>
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
