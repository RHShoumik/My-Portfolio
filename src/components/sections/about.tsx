import Image from "next/image";
import { Clock, Mountain } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { LocalTime } from "@/components/local-time";

const stack = [
  "React.js",
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "React Query",
  "Stripe",
];

export function AboutSection() {
  return (
    <section id="about" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader
          eyebrow="About"
          title="From console logs to mountain fogs."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-6">
          {/* Bio */}
          <div className="card space-y-5 p-7 leading-7 text-foreground/75 md:col-span-4 md:row-span-2 md:p-9">
            <p>
              I&apos;m Shoumik, a frontend engineer from Dhaka. For over four
              years I&apos;ve been building web apps with React, Next.js and
              TypeScript, and most of what I&apos;ve shipped is used by real
              people every day: shoppers, restaurant owners, club members.
            </p>
            <p>
              I started out in 2020 at a small company, making responsive
              websites and React apps, then moved through a few startups where
              I got to do a bit of everything. At 6amTech I shipped major
              features for 6amMart and StackFood, two multi-vendor marketplaces
              with millions of users. These days I&apos;m at JustGo
              Technologies, building a membership system for clubs and national
              governing bodies: bookings, payments, admin tools, all of it.
            </p>
            <p>
              What I enjoy most is the unglamorous side of the job: components
              other people can pick up without a tour, pages that load fast,
              forms that don&apos;t fight you. And when I log off, I go
              travelling. Sajek above the clouds, the long beach at
              Cox&apos;s Bazar, the hills of Bandarban. Trekking clears my head
              better than any debugger.
            </p>
          </div>

          {/* Photo */}
          <div className="card relative min-h-72 overflow-hidden md:col-span-2 md:row-span-2">
            <Image
              src="/images/about-photo.jpeg"
              alt="Ragib on a hike, surrounded by hills and fog"
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
            />
          </div>

          {/* Quick facts */}
          <div className="card flex flex-col justify-between p-6 md:col-span-2">
            <p className="font-display text-5xl font-bold tracking-[-0.05em]">
              4<span className="text-[var(--palette-swatch)]">+</span>
            </p>
            <p className="mt-6 text-sm text-foreground/60">
              years building for the web
            </p>
          </div>

          <div className="card flex flex-col justify-between p-6 md:col-span-2">
            <Clock className="size-5 text-[var(--palette-swatch)]" />
            <div className="mt-6">
              <p className="font-display text-3xl font-bold tracking-[-0.04em]">
                <LocalTime />
              </p>
              <p className="mt-1 text-sm text-foreground/60">
                in Dhaka, Bangladesh
              </p>
            </div>
          </div>

          <div className="card flex flex-col justify-between p-6 md:col-span-2">
            <Mountain className="size-5 text-[var(--palette-swatch)]" />
            <div className="mt-6">
              <p className="font-display text-xl font-bold tracking-[-0.03em]">
                Trekking &amp; travel
              </p>
              <p className="mt-1 text-sm text-foreground/60">
                what I do off the clock
              </p>
            </div>
          </div>

          {/* Stack */}
          <div className="card p-6 md:col-span-6 md:p-7">
            <p className="text-sm font-medium text-foreground/60">
              What I use most
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {stack.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-border bg-secondary px-3.5 py-1.5 text-sm font-medium"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
