import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { PageLoader } from "@/components/page-loader";
import { SoundEffects } from "@/components/sound-effects";
import { SoundToggle } from "@/components/sound-toggle";
import { siteConfig } from "@/lib/constants";
import {
  KEYWORDS,
  PROFILE_IMAGE,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
  siteJsonLd,
} from "@/lib/seo";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#101713" },
  ],
  width: "device-width",
  initialScale: 1,
};

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: `%s · ${siteConfig.name}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: "RHShoumik",
  metadataBase: new URL(SITE_URL),
  keywords: KEYWORDS,
  authors: [{ name: siteConfig.name, url: SITE_URL }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "technology",
  openGraph: {
    type: "profile",
    firstName: "Ragib Hassan",
    lastName: "Shoumik",
    username: "rhshoumik",
    locale: "en_US",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: siteConfig.name,
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: PROFILE_IMAGE.alt,
      },
      PROFILE_IMAGE,
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/api/og"],
    creator: "@rhshoumik",
    site: "@rhshoumik",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('rhs_loaded'))document.documentElement.setAttribute('data-seen','1')}catch(e){}",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
        />
      </head>
      <body
        className={`${bricolage.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <Providers>
          <PageLoader />
          <SoundEffects />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <SoundToggle />
          <ThemeSwitcher />
        </Providers>
      </body>
    </html>
  );
}
