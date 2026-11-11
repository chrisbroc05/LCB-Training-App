/**
 * Old public PDF paths that should 301 to free Instagram landings or stay listed.
 * Used by next.config redirects and docs/tests.
 */

export type PublicPdfRedirect = {
  /** Next.js redirect source (may include :path* or exact). */
  source: string;
  destination: string;
  permanent: true;
};

/** Sample PDFs that map to Instagram free landings. */
export const PUBLIC_PDF_FREE_LANDING_REDIRECTS: PublicPdfRedirect[] = [
  { source: "/lcb_rotational_sample.pdf", destination: "/free/rotate", permanent: true },
  { source: "/LCB_Rotational_Sample.pdf", destination: "/free/rotate", permanent: true },
  { source: "/LCB_Rotational_Sample.PDF", destination: "/free/rotate", permanent: true },
  { source: "/lcb_mobility_sample.pdf", destination: "/free/mobility", permanent: true },
  { source: "/LCB_Mobility_Sample.pdf", destination: "/free/mobility", permanent: true },
  { source: "/LCB_Mobility_Sample.PDF", destination: "/free/mobility", permanent: true },
];

/**
 * Other public/*.pdf files that remain static assets (not redirected).
 * List for ops / ManyChat cleanup; do not 301 these unless a landing exists.
 */
export const PUBLIC_PDF_STATIC_FILES = [
  "/LCB_Strength_Sample.pdf",
  "/LCB_Coach_Bio.pdf",
  "/LCB_Coach_Bio-old.pdf",
  "/LCB_Coaches_Handout.pdf",
  "/LCB_Social_Graphic.pdf",
  "/LCB_Social_Template.pdf",
] as const;
