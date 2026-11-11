/**
 * Instagram / ManyChat free-resource short links (client-safe).
 */

export const INSTAGRAM_FREE_LINK_KEYWORDS = ["rotate", "mobility"] as const;

export type InstagramFreeLinkKeyword = (typeof INSTAGRAM_FREE_LINK_KEYWORDS)[number];

export type InstagramFreeLinkDefinition = {
  keyword: InstagramFreeLinkKeyword;
  path: `/free/${InstagramFreeLinkKeyword}`;
  resourceSlug: string;
  leadSource: string;
};

export const INSTAGRAM_FREE_LINKS: Record<InstagramFreeLinkKeyword, InstagramFreeLinkDefinition> = {
  rotate: {
    keyword: "rotate",
    path: "/free/rotate",
    resourceSlug: "rotational-sample",
    leadSource: "ig-rotate",
  },
  mobility: {
    keyword: "mobility",
    path: "/free/mobility",
    resourceSlug: "mobility-sample",
    leadSource: "ig-mobility",
  },
};

export function isInstagramFreeLinkKeyword(value: string): value is InstagramFreeLinkKeyword {
  return (INSTAGRAM_FREE_LINK_KEYWORDS as readonly string[]).includes(value);
}

export function getInstagramFreeLink(keyword: string): InstagramFreeLinkDefinition | null {
  if (!isInstagramFreeLinkKeyword(keyword)) {
    return null;
  }
  return INSTAGRAM_FREE_LINKS[keyword];
}
