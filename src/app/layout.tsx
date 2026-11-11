import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { PROFILE, SITE_URL } from "@/lib/site";

// Self-hosted variable fonts (via @fontsource): no build-time network calls to Google.
const display = localFont({
  src: "../../node_modules/@fontsource-variable/big-shoulders/files/big-shoulders-latin-opsz-normal.woff2",
  variable: "--font-display-var",
  weight: "100 900",
  display: "swap",
  fallback: ["Arial Narrow", "sans-serif"],
});
const sans = localFont({
  src: "../../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-standard-normal.woff2",
  variable: "--font-sans-var",
  weight: "400 700",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
const mono = localFont({
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-mono-var",
  weight: "100 800",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

const title = "Man Singh: systems + vision";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: "%s · Man Singh" },
  description: PROFILE.description,
  applicationName: "Man Singh",
  authors: [{ name: PROFILE.name, url: PROFILE.links.github }],
  creator: PROFILE.name,
  keywords: [
    "Man Singh",
    "backend engineer",
    "AI/ML research",
    "vision-language models",
    "competitive programming",
    "IIIT Agartala",
    "portfolio",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title,
    description: PROFILE.description,
    siteName: "Man Singh",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title, description: PROFILE.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
    { media: "(prefers-color-scheme: light)", color: "#efebe3" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Runs before paint: apply saved theme (dark is the default look).
// Also skips the boot preloader on repeat visits in this tab, for reduced motion, and on phones (speed first).
const themeScript = `try{var d=document.documentElement,t=localStorage.getItem('theme');if(t==='light'||t==='dark')d.dataset.theme=t;if(sessionStorage.getItem('booted')||matchMedia('(prefers-reduced-motion: reduce)').matches||matchMedia('(max-width: 767px)').matches)d.dataset.booted='1';}catch(e){}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: PROFILE.name,
  url: SITE_URL,
  email: `mailto:${PROFILE.email}`,
  jobTitle: "AI/ML Research Intern",
  alumniOf: { "@type": "CollegeOrUniversity", name: "Indian Institute of Information Technology, Agartala" },
  sameAs: [PROFILE.links.github, PROFILE.links.linkedin, PROFILE.links.leetcode, PROFILE.links.codeforces],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* must run synchronously before first paint (next/script would defer it) */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <noscript>
          <style>{`.preloader{display:none!important}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
