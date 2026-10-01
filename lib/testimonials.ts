export type Testimonial = {
  quote: string;
  attribution: string;
  featured: boolean;
};

export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "I really love the way you explain the game and your attention to detail. Just in the video alone I was able to understand the way you dissected it. That's amazing. Thank you for taking the time to evaluate his swing. It means the world to me. He is going to be stoked.",
    attribution: "Parent of a baseball player, after a free swing breakdown",
    featured: true,
  },
  {
    quote:
      "You explained the drills in a way that really seemed to click in her brain. We are going to work on this all week.",
    attribution: "Parent of a softball player, after a free swing breakdown",
    featured: true,
  },
  {
    quote:
      "I hit around .350 this year and batted leadoff for most of the season. That's way better than it was in the past. I'm definitely happy with the season, especially my hitting.",
    attribution: "Varsity infielder, Class of 2026",
    featured: false,
  },
  {
    quote:
      "After your lesson with my son, he was so excited. The next game he went 3 for 3, got in the car, and said, 'I did what Coach Chris taught me, and it worked.'",
    attribution: "Parent of a 13U player",
    featured: false,
  },
  {
    quote: "My team cannot stop talking about your training and would love to have you back again.",
    attribution: "15U baseball coach",
    featured: false,
  },
] as const;

export function getFeaturedTestimonials() {
  return TESTIMONIALS.filter((entry) => entry.featured);
}

function hashRotationSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

export function selectEmailTestimonials(options?: { maxCount?: number; rotationSeed?: string }) {
  const featured = getFeaturedTestimonials();
  const maxCount = options?.maxCount ?? featured.length;

  if (maxCount >= featured.length) {
    return featured;
  }

  if (maxCount <= 0) {
    return [];
  }

  if (maxCount === 1 && options?.rotationSeed) {
    const startIndex = hashRotationSeed(options.rotationSeed) % featured.length;
    return [featured[startIndex]];
  }

  return featured.slice(0, maxCount);
}
