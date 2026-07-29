import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toast } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SVP Dual-Panel Portal | User & Admin Management Platform",
  description: "Next.js Dual-Panel Portal featuring User Registration, User Login, Admin Login, User Dashboard, and Admin Control Panel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full dark antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function createMemoryStorage() {
                  var store = {};
                  return {
                    getItem: function(k) { return store[k] !== undefined ? store[k] : null; },
                    setItem: function(k, v) { store[k] = String(v); },
                    removeItem: function(k) { delete store[k]; },
                    clear: function() { store = {}; },
                    key: function(i) { return Object.keys(store)[i] || null; },
                    get length() { return Object.keys(store).length; }
                  };
                }
                try {
                  var _ = window.localStorage;
                } catch(e) {
                  try { Object.defineProperty(window, 'localStorage', { value: createMemoryStorage(), writable: true, configurable: true, enumerable: true }); } catch(err) {}
                }
                try {
                  var _s = window.sessionStorage;
                } catch(e) {
                  try { Object.defineProperty(window, 'sessionStorage', { value: createMemoryStorage(), writable: true, configurable: true, enumerable: true }); } catch(err) {}
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#0b0f19] text-gray-100 selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          {children}
          <Toast />
        </AuthProvider>
      </body>
    </html>
  );
}
