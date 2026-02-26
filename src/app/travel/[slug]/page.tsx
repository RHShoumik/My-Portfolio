import { getAllTravelPosts, getTravelPostBySlug } from "@/lib/travel";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Route, Calendar } from "lucide-react";
import type { Metadata } from "next";
import { TravelContent } from "@/components/travel/travel-content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllTravelPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getTravelPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} — Travel — Ragib Hassan Shoumik`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      url: `https://rhshoumik.dev/travel/${slug}`,
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function TravelPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getTravelPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen">
      {/* Cinematic Hero */}
      <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
        {/* Cover Image */}
        <Image
          src={post.cover}
          alt={post.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-4xl px-6 pb-12">
            {/* Back link */}
            <Link
              href="/travel"
              className="mb-6 inline-flex items-center gap-2 text-sm text-foreground/70 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to Map
            </Link>

            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              {post.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-foreground/80">
              {post.description}
            </p>
          </div>
        </div>
      </section>

      {/* Route Summary Card */}
      <div className="mx-auto -mt-6 max-w-4xl px-6">
        <div className="glass-card flex flex-wrap items-center gap-6 p-5 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            <span>{post.country}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Route className="size-4 text-primary" />
            <span>{post.distance} km from Dhaka</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4 text-primary" />
            <span>
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* MDX Content */}
      <article className="mx-auto max-w-4xl px-6 pt-12 pb-20">
        <TravelContent content={post.content} />
      </article>
    </main>
  );
}
