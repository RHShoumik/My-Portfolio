export const siteConfig = {
  name: "Ragib Hassan Shoumik",
  title: "Software Engineer in Dhaka, Bangladesh",
  description:
    "Ragib Hassan Shoumik (RHShoumik) is a software engineer in Dhaka, Bangladesh, building fast web apps and 3D experiences with React, Next.js and Three.js.",
  url: "https://www.rhshoumik.dev",
  ogImage: "https://www.rhshoumik.dev/og.png",
  links: {
    github: "https://github.com/rhshoumik",
    linkedin: "https://www.linkedin.com/in/ragib-hassan/",
    email: "mailto:rhshoumik101@gmail.com",
  },
} as const;

export const navItems = [
  { label: "About", href: "/#about" },
  { label: "Experience", href: "/#experience" },
  { label: "Projects", href: "/#projects" },
  { label: "Skills", href: "/#skills" },
  { label: "Blog", href: "/blog" },
  { label: "Travel", href: "/travel" },
  { label: "Contact", href: "/#contact" },
] as const;

export type Palette =
  | "default"
  | "emerald"
  | "indigo"
  | "rose"
  | "amber"
  | "cyan";

export const palettes: {
  id: Palette;
  label: string;
  color: string;
}[] = [
  { id: "default", label: "Jade", color: "#187258" },
  { id: "emerald", label: "Green", color: "#0f9f72" },
  { id: "indigo", label: "Violet", color: "#7c5cff" },
  { id: "rose", label: "Pink", color: "#e5397f" },
  { id: "amber", label: "Orange", color: "#f26a1b" },
  { id: "cyan", label: "Cyan", color: "#0891b2" },
];

export const experiences = [
  {
    company: "JustGo Technologies Limited",
    role: "Front-End Engineer",
    period: "April 2024 — Present",
    description:
      "Contributed as a Front-End Engineer to JustGo Technologies Limited — a complete membership management system for clubs and national governing bodies (NGBs). Built frontend architecture and user interfaces for administrative automation, streamlined membership journeys, smart business rules, complex booking flows, real-time data views, and Stripe payment integrations, with a focus on performance and SEO.",
    tech: ["React.js", "TypeScript", "Tailwind CSS", "React Query", "Stripe"],
  },
  {
    company: "6amTech",
    role: "Software Engineer Grade I",
    period: "2023 — 2024",
    description:
      "Architected and shipped major features for 6amMart & StackFood — multi-vendor marketplace platforms serving millions of users. Led performance optimization initiatives reducing load times by 40%.",
    tech: ["React.js", "Next.js", "Material UI", "REST APIs", "Google Maps"],
  },
  {
    company: "HypeScout Pte. Ltd",
    role: "Frontend Developer",
    period: "2022 — 2023",
    description:
      "Built the influencer marketing platform frontend from the ground up. Implemented real-time dashboards, campaign analytics, and PayPal payment flows as part of HypeScout's Dhaka team.",
    tech: ["React.js", "TypeScript", "Tailwind CSS", "PayPal", "Chart.js"],
  },
  {
    company: "Workspace InfoTech Limited",
    role: "Junior Frontend Developer",
    period: "2020 — 2021",
    description:
      "Started professional journey building responsive websites and React SPAs. Gained deep expertise in component architecture and state management patterns.",
    tech: ["React.js", "JavaScript", "Bootstrap", "Redux"],
  },
] as const;

export const projects = [
  {
    title: "6amMart",
    description:
      "A multi-vendor e-commerce marketplace supporting food, grocery, and pharmacy deliveries with real-time tracking, multiple payment gateways, and location-based services.",
    tech: ["React.js", "Next.js", "Material UI", "Google Maps", "REST APIs"],
    url: "https://6ammart.6amtech.com",
    image: "/projects/6ammart.png",
  },
  {
    title: "StackFood",
    description:
      "A feature-rich food delivery platform with restaurant management, rider tracking, and admin dashboards. Handles millions of orders with optimized performance.",
    tech: ["React.js", "Next.js", "Tailwind CSS", "React Query", "Stripe"],
    url: "https://stackfood.6amtech.com",
    image: "/projects/stackfood.png",
  },
  {
    title: "Zeyra E-commerce",
    description:
      "A modern e-commerce storefront with advanced filtering, cart management, checkout flow, and payment integration. Built for scalability and conversion optimization.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Stripe", "Zustand"],
    url: "#",
    image: "/projects/zeyra.png",
  },
  {
    title: "HypeScout Platform",
    description:
      "An influencer marketing platform connecting brands with content creators. Features campaign management, analytics dashboards, and automated payment processing.",
    tech: ["React.js", "TypeScript", "Tailwind CSS", "PayPal", "Chart.js"],
    url: "https://hypescout.co",
    image: "/projects/hypescout.png",
  },
  {
    title: "Media Planning Tool",
    description:
      "A TV campaign planning system for media agencies: an 11-step wizard, spot allocation across channels and days, a pure GRP/CPRP calculation engine, Excel rate-card import and a 5-sheet Excel export.",
    tech: ["React.js", "TypeScript", "Zustand", "Tailwind CSS", "Excel Export"],
    url: "#",
    image: "/projects/media-planning-tool.png",
  },
  {
    title: "Hextech BD",
    description:
      "A multi-vendor e-commerce marketplace with storefront, vendor dashboards and an admin panel, four payment gateways, AI tools and 17 languages including right-to-left Arabic.",
    tech: ["Next.js", "TypeScript", "MongoDB", "Tailwind CSS", "Stripe"],
    url: "https://hextechbd.com",
    image: "/projects/hextechbd.png",
  },
  {
    title: "Free Invoice Generator",
    description:
      "A free online invoice maker: pick from 100+ templates, fill in the details and download a professional invoice as PDF or PNG in one click. No sign-up and no watermark.",
    tech: ["100+ Templates", "PDF Export", "PNG Export", "No Sign-up"],
    url: "https://free-invoice-generator.rhshoumik.dev/",
    image: "/projects/free-invoice-generator.png",
  },
] as const;

export const skillGroups = [
  {
    category: "Frontend",
    skills: [
      "React.js",
      "Next.js",
      "TypeScript",
      "JavaScript (ES6+)",
      "Tailwind CSS",
      "Material UI",
      "ShadCN UI",
      "Framer Motion",
      "HTML5 / CSS3",
    ],
  },
  {
    category: "State & Data",
    skills: [
      "Zustand",
      "Redux Toolkit",
      "React Query",
      "SWR",
      "REST APIs",
      "GraphQL",
    ],
  },
  {
    category: "Backend & Integrations",
    skills: [
      "Node.js",
      "Express.js",
      "Stripe",
      "PayPal",
      "Google Maps API",
      "Firebase",
    ],
  },
  {
    category: "Tooling",
    skills: [
      "Git & GitHub",
      "VS Code",
      "Webpack / Vite",
      "ESLint / Prettier",
      "Vercel",
      "Docker",
    ],
  },
  {
    category: "Testing",
    skills: [
      "Jest",
      "React Testing Library",
      "Cypress",
      "Playwright",
    ],
  },
  {
    category: "Design",
    skills: [
      "Figma",
      "Responsive Design",
      "Design Systems",
      "Accessibility (a11y)",
    ],
  },
] as const;
