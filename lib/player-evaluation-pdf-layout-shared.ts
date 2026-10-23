/**
 * Layout tokens for player evaluation PDFs (client-safe).
 */

export const PLAYER_EVAL_PDF_COLORS = {
  navy: "#0A1628",
  green: "#2D6A4F",
  lightGreen: "#52B788",
  lightGray: "#F5F5F5",
  white: "#FFFFFF",
} as const;

/** Letter page, inches converted to PDF points (72 pt/in). */
export const PLAYER_EVAL_PDF_LAYOUT = {
  pageWidth: 612,
  pageHeight: 792,
  marginTop: 0.4 * 72,
  marginBottom: 0.4 * 72,
  marginLeft: 0.85 * 72,
  marginRight: 0.85 * 72,
  contentWidth: 6.8 * 72,
  columnWidth: 3.4 * 72,
  columnGap: 0,
  logoMaxWidth: 2.25 * 72,
  logoMaxHeight: 0.92 * 72,
  sectionHeaderPaddingY: 8,
  sectionBodyPadding: 10,
  sectionLeftBarWidth: 4,
  sectionBorderWidth: 0.8,
  hrThickness: 1.1,
} as const;

export const PLAYER_EVAL_LOGO_RELATIVE_PATH = "public/logo/lcb-training-logo.png";
