import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";

/**
 * Turn a post's markdown into HTML: headings, lists, links, tables, code.
 * The page already shows the post title as its one <h1>, so a leading
 * "# Title" line in the file is dropped rather than printed twice.
 * Posts are our own files, so raw HTML in them is allowed.
 */
export function markdownToHtml(md: string): string {
  const body = md.replace(/^\s*# [^\n]*\n/, "");
  return micromark(body, {
    allowDangerousHtml: true,
    extensions: [gfm()],
    htmlExtensions: [gfmHtml()],
  });
}
