import Image from "next/image";
import Link from "next/link";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { getAllTravelPosts, type TravelPost } from "@/lib/travel";

function TravelBlogCard({ post }: { post: TravelPost }) {
  return (
    <Link
      href={`/travel/${post.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-xl"
    >
      {/* Cover */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={post.cover}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

        {/* Country badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
          <MapPin className="size-3 text-primary" />
          {post.country}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-3" />
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          <span className="text-border">·</span>
          <span>{post.distance} km</span>
        </div>

        <h3 className="mt-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {post.description}
        </p>

        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-all group-hover:gap-2.5">
          Read the Story
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function TravelBlogCards() {
  const posts = getAllTravelPosts();

  if (posts.length === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {posts.map((post) => (
        <TravelBlogCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
