import fs from "fs";
import path from "path";
import matter from "gray-matter";

const TRAVEL_DIR = path.join(process.cwd(), "src/content/travel");

export interface TravelPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  country: string;
  distance: number;
  cover: string;
  published: boolean;
  content: string;
}

export function getAllTravelPosts(): TravelPost[] {
  if (!fs.existsSync(TRAVEL_DIR)) return [];

  const files = fs.readdirSync(TRAVEL_DIR).filter((f) => f.endsWith(".mdx"));

  const posts = files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(TRAVEL_DIR, file), "utf-8");
      const { data, content } = matter(raw);

      return {
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        date: data.date ?? new Date().toISOString(),
        country: data.country ?? "",
        distance: data.distance ?? 0,
        cover: data.cover ?? "",
        published: data.published !== false,
        content,
      } satisfies TravelPost;
    })
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getTravelPostBySlug(slug: string): TravelPost | undefined {
  const posts = getAllTravelPosts();
  return posts.find((p) => p.slug === slug);
}
