import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/api/auth-context';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata =  {
  title: "Crescent Learning | Quality Education & Coaching | NMMS Preparation",
  description:
    "Crescent Learning - 38+ years of excellence in education. NMMS coaching, online courses, hybrid tuition, and student development programs. Join our Primary, Secondary, Senior Secondary, and Competitive Coaching divisions.",
  keywords: [
    "Kadungathukundu",
    "Kalpakanchery",
    "Valavannur",
    "Crescent Learning",
    "Crescent Academy",
    "quality education",
    "coaching center",
    "online courses",
    "hybrid tuition",
    "crescent",
    "education",
    "coaching",
    "NMMS",
    "competitive exams",
    "school",
    "tuition",
    "academic excellence",
    "student development",
  ],
  generator: "v0.app",
  authors: [{ name: "Crescent Learning" }],
  creator: "Crescent Learning",
  publisher: "Crescent Learning",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://crescentlearning.org",
    siteName: "Crescent Learning",
    title: "Crescent Learning | Quality Education & Coaching",
    description: "38+ years of excellence in education with comprehensive coaching programs",
    images: [
      {
        url: "https://crescentlearning.org/crescent.png",
        width: 1200,
        height: 630,
        alt: "Crescent Learning - Quality Education",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crescent Learning | Quality Education & Coaching",
    description: "38+ years of excellence in education with comprehensive coaching programs",
    images: ["https://crescentlearing.org/og-image.png"],
  },
  alternates: {
    canonical: "https://crescentlearning.org",
  },
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Static Favicon (Recommended) */}
    // Replace your current favicon section with this complete implementation
{/* <link rel="icon" href="/crescent.png" type="image/png" />
{/* Primary Favicon - Multiple formats for compatibility */}
{/* <link rel="icon" href="/favicon.ico" sizes="32x32" /> */}
{/* <link rel="icon" href="/favicon.svg" type="image/svg+xml" /> */}
{/* <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" /> */}
{/* <link rel="icon" href="/favicon-192x192.png" type="image/png" sizes="192x192" /> */}
{/* <link rel="icon" href="/favicon-512x512.png" type="image/png" sizes="512x512" /> */}

{/* Apple Touch Icons */}
{/* <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" /> */}

{/* Web App Manifest */}
{/* <link rel="manifest" href="/site.webmanifest" /> */}

{/* Microsoft Tile */}
{/* <meta name="msapplication-TileColor" content="#000000" /> */}
{/* <meta name="msapplication-config" content="/browserconfig.xml" /> */} 
<link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />


        {/* Font Preload */}
        <link
          rel="preload"
          href="/fonts/Inter.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          fetchPriority="high"
        />

        {/* Google Tag Manager */}
        {/* <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:'';
              j.async=true; j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-MBJSN67T');
          `}
        </Script> */}

      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MBJSN67T"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        
        {/* Skip to main content link for accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only">
          Skip to main content
        </a>

          <div className="fixed inset-0 z-0 bg-white">
            {/* <Plasma color="#f82" speed={0.8} direction="forward" scale={1.5} opacity={0.5} mouseInteractive={true} /> */}
          </div>
          <div className="relative z-10">{children}</div>
      </body>
    </html>

  );
}
