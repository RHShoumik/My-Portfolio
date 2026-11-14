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

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.title}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  keywords: [
    "Ragib Hassan Shoumik",
    "Ragib Hassan",
    "Shoumik",
    "rhshoumik",
    "RH Shoumik",
    "Ragib Shoumik",
    "React",
    "Next.js",
    "TypeScript",
    "Frontend Engineer",
    "Portfolio",
    "Web Developer",
    "Tailwind CSS",
    "JavaScript Developer",
    "Full Stack Developer",
    "rhshoumik.dev",
    "Bangladesh Developer",
    "React Developer Bangladesh",
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.title}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/api/og`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.title}`,
    description: siteConfig.description,
    images: [`${siteConfig.url}/api/og`],
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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Ragib Hassan Shoumik",
              alternateName: ["Ragib Hassan", "Shoumik", "rhshoumik", "RH Shoumik"],
              url: siteConfig.url,
              jobTitle: "Frontend Engineer",
              description:
                "Senior Frontend Engineer specializing in React, Next.js, and TypeScript.",
              sameAs: [
                siteConfig.links.github,
                siteConfig.links.linkedin,
              ],
            }),
          }}
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
