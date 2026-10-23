import { getAllPosts } from "@/lib/blog";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Ragib Hassan Shoumik",
  description:
    "Thoughts on frontend architecture, React patterns, and building for the web.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen pt-28 pb-20 md:pt-32">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <p className="index-num mb-2 font-mono text-xs uppercase tracking-widest text-[var(--palette-swatch)]">
          Blog
        </p>
        <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
          Writing &{" "}
          <span className="font-serif italic font-normal text-gradient">thoughts</span>
        </h1>
        <p className="mb-14 text-muted-foreground">
          Occasional posts about frontend architecture, React patterns, and
          things I learn along the way.
        </p>

        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No posts yet. Check back soon!
          </p>
        ) : (
          <div className="border-t border-border">
            {posts.map((post, i) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                data-cursor="READ"
                className="group flex flex-col gap-2 border-b border-border py-7"
              >
                <div className="flex items-baseline gap-4">
                  <span className="index-num text-xs text-muted-foreground/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <time className="font-mono text-xs text-muted-foreground">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
                <h2 className="pl-10 text-xl font-semibold text-foreground transition-colors group-hover:text-[var(--palette-swatch)] md:text-2xl">
                  {post.title}
                </h2>
                <p className="pl-10 text-sm leading-relaxed text-muted-foreground">
                  {post.description}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5 pl-10">
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
