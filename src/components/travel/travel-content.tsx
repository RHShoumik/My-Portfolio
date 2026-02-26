"use client";

import { motion } from "framer-motion";

interface TravelContentProps {
  content: string;
}

/**
 * Renders travel MDX content with scroll-triggered fade-in animation.
 * Uses the same simple markdown→HTML approach as the blog system.
 */
export function TravelContent({ content }: TravelContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-code:text-primary prose-pre:bg-card prose-pre:border prose-pre:border-border prose-img:rounded-2xl prose-img:shadow-lg prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground prose-p:leading-relaxed prose-lg"
    >
      <div dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
    </motion.div>
  );
}

function markdownToHtml(md: string): string {
  return md
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/```(\w+)?\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    .replace(/^> (.*$)/gm, "<blockquote><p>$1</p></blockquote>")
    .replace(/^---$/gm, "<hr />")
    .replace(/^\- (.*$)/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, (match) =>
      match.startsWith("<ul>") ? match : `<ul>${match}</ul>`
    )
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[a-z/])(.*)/gm, (match) => {
      if (match.trim() === "" || match.startsWith("<")) return match;
      return `<p>${match}</p>`;
    });
}
