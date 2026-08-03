import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toast } from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SVP Dual-Panel Portal | User & Admin Management Platform",
  description: "Next.js Dual-Panel Portal featuring User Registration, User Login, Admin Login, User Dashboard, and Admin Control Panel.",
  icons: {
    icon: [
      { url: "/fabicon.png?v=2", type: "image/png" },
      { url: "/favicon.ico?v=2" },
    ],
    shortcut: "/fabicon.png?v=2",
    apple: "/fabicon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full dark antialiased`}>
      <head>
        <link rel="icon" href="/fabicon.png?v=2" type="image/png" />
        <link rel="icon" href="/favicon.ico?v=2" />
        <link rel="shortcut icon" href="/fabicon.png?v=2" />
        <link rel="apple-touch-icon" href="/fabicon.png?v=2" />
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
      <body suppressHydrationWarning className="min-h-full flex flex-col selection:bg-purple-500 selection:text-white transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toast />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
