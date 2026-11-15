import { experiences, siteConfig } from "@/lib/constants";

/*
 * Everything search engines read about the site in one place: the title and
 * short intro Google shows, the photo, and the structured data (JSON-LD)
 * that tells Google who Ragib is, so a search for any of his names finds
 * this site.
 */

export const SITE_URL = siteConfig.url;

/** The square headshot used in search results, link previews and JSON-LD. */
export const PROFILE_IMAGE = {
  url: `${SITE_URL}/images/ragib-hassan-shoumik.jpg`,
  width: 800,
  height: 800,
  alt: "Ragib Hassan Shoumik (RHShoumik), software engineer in Dhaka, Bangladesh",
};

/** The page title Google shows (kept near 60 characters so it is not cut). */
export const SITE_TITLE = "Ragib Hassan Shoumik (RHShoumik) · Software Engineer, Dhaka";

/** The short intro Google shows under the title (about 155 characters). */
export const SITE_DESCRIPTION =
  "Ragib Hassan Shoumik (RHShoumik) is a software engineer in Dhaka, Bangladesh, building fast web apps and 3D experiences with React, Next.js and Three.js.";

/** Every name people may search for. */
export const ALTERNATE_NAMES = [
  "Ragib",
  "Ragib Hassan",
  "Shoumik",
  "RHShoumik",
  "RH Shoumik",
  "Ragib Shoumik",
  "Ragib Hassan Shoumik",
];

export const KEYWORDS = [
  ...ALTERNATE_NAMES,
  "Ragib bd",
  "Shoumik bd",
  "Ragib AIUB",
  "Shoumik AIUB",
  "Ragib Hassan Shoumik AIUB",
  "software engineer",
  "software engineer in Dhaka",
  "software engineer in Bangladesh",
  "software engineer in BD",
  "frontend engineer Bangladesh",
  "Three.js engineer",
  "Three.js engineer in Bangladesh",
  "Three.js developer BD",
  "React developer Bangladesh",
  "Next.js developer Dhaka",
  "rhshoumik.dev",
];

const currentJob = experiences[0];

/** Structured data for the whole site: the website, the person, the profile page. */
export function siteJsonLd() {
  const person = {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: "Ragib Hassan Shoumik",
    givenName: "Ragib Hassan",
    familyName: "Shoumik",
    alternateName: ALTERNATE_NAMES.filter((n) => n !== "Ragib Hassan Shoumik"),
    url: SITE_URL,
    image: {
      "@type": "ImageObject",
      url: PROFILE_IMAGE.url,
      width: PROFILE_IMAGE.width,
      height: PROFILE_IMAGE.height,
      caption: PROFILE_IMAGE.alt,
    },
    jobTitle: "Software Engineer",
    description: SITE_DESCRIPTION,
    worksFor: { "@type": "Organization", name: currentJob.company },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "American International University-Bangladesh (AIUB)",
      alternateName: "AIUB",
      url: "https://www.aiub.edu",
    },
    homeLocation: { "@type": "Place", name: "Dhaka, Bangladesh" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dhaka",
      addressCountry: "BD",
    },
    nationality: { "@type": "Country", name: "Bangladesh" },
    knowsAbout: [
      "Software Engineering",
      "Frontend Engineering",
      "Three.js",
      "WebGL",
      "React Three Fiber",
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
    ],
    sameAs: [siteConfig.links.github, siteConfig.links.linkedin],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Ragib Hassan Shoumik",
        alternateName: ["RHShoumik", "rhshoumik.dev"],
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": `${SITE_URL}/#person` },
      },
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}/#profile`,
        url: SITE_URL,
        name: SITE_TITLE,
        description: SITE_DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        primaryImageOfPage: { "@id": `${SITE_URL}/#person` },
        mainEntity: { "@id": `${SITE_URL}/#person` },
      },
      person,
    ],
  };
}

/** Structured data for one blog or travel post. */
export function articleJsonLd(post: {
  title: string;
  description: string;
  date: string;
  url: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url: post.url,
    mainEntityOfPage: post.url,
    image: post.image ? new URL(post.image, SITE_URL).toString() : PROFILE_IMAGE.url,
    author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Ragib Hassan Shoumik", url: SITE_URL },
    publisher: { "@id": `${SITE_URL}/#person` },
  };
}
