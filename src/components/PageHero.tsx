/**
 * Full-bleed photo band that opens the main app pages, themed via
 * `--hero-image`. Purely decorative, so it carries no alt text and is
 * dropped from print.
 */
export function PageHero() {
  return <div className="page-hero no-print" />;
}
