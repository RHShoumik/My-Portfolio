import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ScrollProgress } from "@/components/scroll-progress";
import { CustomCursor } from "@/components/custom-cursor";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { siteConfig } from "@/lib/constants";
import "./globals.css";
import { PageLoader } from "@/components/page-loader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
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
                `https://linkedin.com/in/rhshoumik`,
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
        <PageLoader />
          <ScrollProgress />
          <CustomCursor />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <ThemeSwitcher />
        </Providers>
      </body>
    </html>
  );
}
