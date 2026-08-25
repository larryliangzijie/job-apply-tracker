import type { Metadata } from "next";
import Script from "next/script";
import { redirect } from "next/navigation";
import { JtLanding } from "@/components/jt/landing";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
};

const FAQ_ITEMS = [
  {
    q: "Is it actually free?",
    a: "Yes, forever. No trial, no surprise tier, no upsells. If we ever add paid features they'll be additive — your existing tracking will always work.",
  },
  {
    q: "Where does my data live?",
    a: "Supabase. You can export your application data anytime.",
  },
  {
    q: "Can I import from a spreadsheet?",
    a: "The autumn recruitment pool is synced into Supabase and your personal progress is kept separately.",
  },
  {
    q: "Does it work on phones?",
    a: "Yes — the web app is responsive and installable as a PWA.",
  },
  {
    q: "Will I get marketing emails?",
    a: "No. Follow-up notifications are only sent when enabled.",
  },
];

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/icon.png`,
};

const softwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: siteConfig.description,
  url: siteConfig.url,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
};

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/jobs");
  }

  return (
    <>
      <Script id="ld-org" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <Script id="ld-software" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }} />
      <Script id="ld-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <JtLanding />
    </>
  );
}
