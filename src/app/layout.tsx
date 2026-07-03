import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider } from "@/components/Toast";
import KeplerAssistant from "@/components/ai/KeplerAssistant";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kepler's Proposal — Plataforma de Propostas Comerciais",
  description: "Gerador premium de propostas comerciais de carregadores elétricos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var x = window.sessionStorage;
                } catch (e) {
                  var mockStorage = {
                    _data: {},
                    setItem: function(k, v) { this._data[k] = String(v); },
                    getItem: function(k) { return this._data.hasOwnProperty(k) ? this._data[k] : null; },
                    removeItem: function(k) { delete this._data[k]; },
                    clear: function() { this._data = {}; }
                  };
                  try {
                    Object.defineProperty(window, 'sessionStorage', { value: mockStorage, configurable: true, writable: true });
                  } catch (err) {
                    window.sessionStorage = mockStorage;
                  }
                }
                try {
                  var y = window.localStorage;
                } catch (e) {
                  var mockStorage = {
                    _data: {},
                    setItem: function(k, v) { this._data[k] = String(v); },
                    getItem: function(k) { return this._data.hasOwnProperty(k) ? this._data[k] : null; },
                    removeItem: function(k) { delete this._data[k]; },
                    clear: function() { this._data = {}; }
                  };
                  try {
                    Object.defineProperty(window, 'localStorage', { value: mockStorage, configurable: true, writable: true });
                  } catch (err) {
                    window.localStorage = mockStorage;
                  }
                }
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProvider>
          <ToastProvider>
            {children}
            <KeplerAssistant />
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
