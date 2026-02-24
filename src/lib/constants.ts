export const siteConfig = {
  name: "Ragib Hassan Shoumik",
  title: "Frontend Engineer | React & Next.js Specialist",
  description:
    "Senior Frontend Engineer with 4+ years of experience building scalable web applications with React, Next.js, and TypeScript. Specializing in e-commerce platforms, SaaS products, and modern UI architectures.",
  url: "https://rhshoumik.dev",
  ogImage: "https://rhshoumik.dev/og.png",
  links: {
    github: "https://github.com/rhshoumik",
    linkedin: "https://linkedin.com/in/rhshoumik",
    email: "mailto:contact@rhshoumik.dev",
  },
} as const;

export const navItems = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "#contact" },
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
  { id: "default", label: "Slate", color: "#64748b" },
  { id: "emerald", label: "Emerald", color: "#10b981" },
  { id: "indigo", label: "Indigo", color: "#6366f1" },
  { id: "rose", label: "Rose", color: "#f43f5e" },
  { id: "amber", label: "Amber", color: "#f59e0b" },
  { id: "cyan", label: "Cyan", color: "#06b6d4" },
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
      "Built the influencer marketing platform frontend from the ground up. Implemented real-time dashboards, campaign analytics, and PayPal payment flows for a Singapore-based startup.",
    tech: ["React.js", "TypeScript", "Tailwind CSS", "PayPal", "Chart.js"],
  },
  {
    company: "Driftion",
    role: "Frontend Developer",
    period: "2021 — 2022",
    description:
      "Developed interactive web applications and landing pages for various clients. Focused on pixel-perfect implementations, responsive design, and cross-browser compatibility.",
    tech: ["React.js", "JavaScript", "SCSS", "Framer Motion"],
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
