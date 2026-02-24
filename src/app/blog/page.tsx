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
    <main className="min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-6">
        <p className="mb-2 font-mono text-sm text-primary">Blog</p>
        <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Writing & thoughts
        </h1>
        <p className="mb-12 text-muted-foreground">
          Occasional posts about frontend architecture, React patterns, and
          things I learn along the way.
        </p>

        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No posts yet. Check back soon!
          </p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block rounded-xl border border-border/50 bg-card/50 p-6 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <time className="font-mono text-xs text-muted-foreground">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <h2 className="mt-2 text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {post.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] font-normal"
                    >
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
