/**
 * Stable, royalty-free portrait per seeded doctor (randomuser.me — free to use).
 * Mapped by slug and matched to the name's apparent gender so avatars feel real.
 * The initials avatar remains as a fallback behind the image, so a failed load
 * never leaves a blank circle.
 */
const PHOTOS: Record<string, string> = {
  "ananya-sharma": "https://randomuser.me/api/portraits/women/68.jpg",
  "rajesh-iyer": "https://randomuser.me/api/portraits/men/32.jpg",
  "meera-nair": "https://randomuser.me/api/portraits/women/44.jpg",
  "vikram-deshpande": "https://randomuser.me/api/portraits/men/52.jpg",
  "fatima-qureshi": "https://randomuser.me/api/portraits/women/65.jpg",
  "sandeep-menon": "https://randomuser.me/api/portraits/men/75.jpg",
  "priya-balasubra": "https://randomuser.me/api/portraits/women/29.jpg",
  "arjun-khanna": "https://randomuser.me/api/portraits/men/44.jpg",
  "leela-krishnan": "https://randomuser.me/api/portraits/women/90.jpg",
  "tarun-ghosh": "https://randomuser.me/api/portraits/men/61.jpg",
  "nisha-reddy": "https://randomuser.me/api/portraits/women/12.jpg",
  "imran-shaikh": "https://randomuser.me/api/portraits/men/19.jpg",
};

export function doctorPhoto(slug: string): string | null {
  return PHOTOS[slug] ?? null;
}
