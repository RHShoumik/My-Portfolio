import { getAllPosts } from "@/lib/blog";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes by Ragib Hassan Shoumik (RHShoumik), a software engineer in Dhaka, on frontend architecture, React patterns, Three.js and building for the web.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen pt-28 pb-24 md:pt-36">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <p className="text-sm font-semibold text-[var(--palette-swatch)]">
          Blog
        </p>
        <h1 className="mt-1 font-display text-4xl font-semibold leading-[1.05] sm:text-5xl md:text-6xl">
          Things I&apos;ve{" "}
          <span className="marker whitespace-nowrap">figured out</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-foreground/75">
          Occasional posts about frontend architecture, React patterns, and
          things I learn along the way.
        </p>

        {posts.length === 0 ? (
          <p className="mt-14 text-foreground/60">
            Nothing here yet. Check back soon!
          </p>
        ) : (
          <div className="mt-14 border-t border-border">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block border-b border-border py-8"
              >
                <time className="text-sm font-medium text-[var(--palette-swatch)]">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <h2 className="mt-1 font-display text-2xl font-semibold leading-snug transition-colors group-hover:text-[var(--palette-swatch)] md:text-3xl">
                  {post.title}
                </h2>
                <p className="mt-2 leading-relaxed text-foreground/75">
                  {post.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
