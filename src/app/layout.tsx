import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Markazi_Text } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const markazi = Markazi_Text({
  variable: "--font-markazi",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "مِداد | MIDAD — المستند الذي يتفاعل معك", template: "%s · مِداد" },
  description: "منصة مستندات ذكية تفاعلية: أنشئ مستندات تتفاعل، تُحدّث، تُشارك، وتُفهم — ثم صدّرها PDF عند الحاجة.",
  applicationName: "MIDAD",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F1E8" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
};

// Applies saved theme + locale before first paint to avoid a flash.
const bootScript = `try{var s=JSON.parse(localStorage.getItem('midad:settings')||'{}').state||{};var d=document.documentElement;if(s.theme==='dark')d.classList.add('dark');if(s.locale==='en'){d.lang='en';d.dir='ltr';}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${plex.variable} ${markazi.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
