export interface EventMedia {
  type: "image" | "video";
  src: string;
  poster?: string;
}

export interface EventLink {
  label: string;
  href: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  date: string;
  description: string;
  media: EventMedia[];
  // detail-page fields
  venue: string;
  city: string;
  format: string;
  headliners?: string[];
  promoter?: string;
  promoterUrl?: string;
  context: string;
  setlistNote?: string;
  links?: EventLink[];
}

export const events: Event[] = [
  {
    id: "event18",
    slug: "zebbies-garden-apr-2025",
    title: "Zebbie's Garden (DC)",
    date: "April 2025",
    description: "Opening + Closing for Martin Ikin",
    media: [
      { type: "image", src: "/BrodyEvents/ikin_trio.webp" },
      { type: "video", src: "/BrodyEvents/ikin_fiub.mp4" },
      { type: "video", src: "/BrodyEvents/ikin_percocet.mp4" },
    ],
    venue: "Zebbie's Garden",
    city: "Washington, DC",
    format: "open + close",
    headliners: ["Martin Ikin"],
    promoter: "Club Glow",
    promoterUrl: "https://www.instagram.com/clubglow",
    context:
      "Martin Ikin is one of UK tech house's most consistent voices — a Toolroom Records mainstay known for his technically precise mixing and relentless release schedule. Playing open-to-close alongside him at Zebbie's Garden was an extended run that covered the full arc of the night: early crowd-building through to a late peak-time close.",
    setlistNote:
      'The "Zebs MK2" mix documents the energy from this booking and is available on pbandjsounds.com.',
    links: [
      { label: "pbandjsounds.com", href: "https://pbandjsounds.com" },
      { label: "martin ikin", href: "https://www.instagram.com/martinikin" },
    ],
  },
  {
    id: "event92",
    slug: "flash-rooftop-sep-2025",
    title: "Flash Rooftop (DC)",
    date: "September 2025",
    description: "Opening for Veggi",
    media: [
      { type: "image", src: "/BrodyEvents/veggi_empty.webp" },
      { type: "video", src: "/BrodyEvents/veggi_1.mp4" },
    ],
    venue: "Flash",
    city: "Washington, DC",
    format: "opening set",
    headliners: ["Veggi"],
    context:
      "Flash is DC's preeminent underground club — three floors, a rooftop, and one of the region's most credible booking records. Veggi is a Brooklyn-based DJ and producer with releases on Innervisions and Correspondant imprints, known for a distinctly European sensibility in the American underground. The opening slot ran from early evening into the night before handing off.",
    links: [
      { label: "flash dc", href: "https://www.flashdc.com" },
      { label: "veggi", href: "https://www.instagram.com/veggisounds" },
    ],
  },
  {
    id: "event93",
    slug: "soundcheck-biscits-jul-2025",
    title: "Soundcheck (DC)",
    date: "July 2025",
    description: "Opening + Closing for Biscits",
    media: [
      { type: "image", src: "/BrodyEvents/biscits_headshot.webp" },
      { type: "video", src: "/BrodyEvents/biscits_one_pill.mp4" },
      { type: "video", src: "/BrodyEvents/biscits_crazy.mp4" },
    ],
    venue: "Soundcheck",
    city: "Washington, DC",
    format: "open + close",
    headliners: ["Biscits"],
    promoter: "Club Glow",
    promoterUrl: "https://www.instagram.com/clubglow",
    context:
      "Biscits (Donal Sherlock) is an Irish DJ and producer who has built one of the largest followings in tech house — driven by high-energy tracks like \"One Pill\" and \"Crazy\" on Toolroom, and a relentless touring schedule. Soundcheck draws large crowds for international headliners. Open-to-close on a sold-out night.",
    links: [
      { label: "biscits", href: "https://www.instagram.com/biscitsmusic" },
      { label: "soundcheck dc", href: "https://soundcheckdc.com" },
    ],
  },
  {
    id: "event95",
    slug: "public-art-space-jun-2025",
    title: "Public Art Space (NYC)",
    date: "June 2025",
    description: "",
    media: [
      { type: "video", src: "/BrodyEvents/art_space_gas_pedal.mp4" },
      { type: "video", src: "/BrodyEvents/art_space_freakuency.mp4" },
    ],
    venue: "Public Art Space",
    city: "New York, NY",
    format: "headliner",
    context:
      "The artspace series is a recurring circuit of NYC art-space showcases — smaller capacities, longer sets, and a crowd that leans into the music. These shows sit at the opposite end of the spectrum from the large Club Glow bookings: lower production, higher experimentation. A consistent platform for pushing sounds that wouldn't work in a festival context.",
  },
  {
    id: "event97",
    slug: "power-plant-live-oct-2024",
    title: "Power Plant Live! (Baltimore)",
    date: "October 2024",
    description: "Halloween mainstage set",
    media: [
      { type: "video", src: "/BrodyEvents/powerplant_pump_it.mp4" },
      { type: "video", src: "/BrodyEvents/powerplant_used_to_know.mp4" },
    ],
    venue: "Power Plant Live!",
    city: "Baltimore, MD",
    format: "mainstage",
    promoter: "Club Glow",
    promoterUrl: "https://www.instagram.com/clubglow",
    context:
      "Power Plant Live! is a large entertainment complex in Baltimore's Inner Harbor — a cluster of bars and venues with festival-scale production on major nights. The Halloween mainstage was one of the highest-visibility bookings to date: outdoor stage, large crowd, coordinated through the Club Glow network.",
  },
  {
    id: "event98",
    slug: "soundcheck-ownboss-sep-2024",
    title: "Soundcheck (DC)",
    date: "September 2024",
    description: "Opening for Ownboss",
    media: [
      { type: "image", src: "/BrodyEvents/ownboss_focused.webp" },
      { type: "image", src: "/BrodyEvents/silvertone_duo.webp" },
    ],
    venue: "Soundcheck",
    city: "Washington, DC",
    format: "opening set",
    headliners: ["Ownboss"],
    promoter: "Club Glow",
    promoterUrl: "https://www.instagram.com/clubglow",
    context:
      "Ownboss (Alexander Christoforou) is a Greek DJ and producer known for high-energy output on Ministry of Sound, Toolroom, and major labels — his \"Move Your Body\" collab with Sevenn became a peak-time staple across circuits worldwide. An early Soundcheck booking that helped establish the Club Glow pipeline as a consistent source of slots.",
    links: [{ label: "ownboss", href: "https://www.instagram.com/ownboss" }],
  },
  {
    id: "event99",
    slug: "somewhere-nowhere-jul-2024",
    title: "Somewhere Nowhere (NYC)",
    date: "July 2024",
    description: "4th of July rooftop set",
    media: [
      { type: "video", src: "/BrodyEvents/swnw_kill_bill.mp4" },
      { type: "image", src: "/BrodyEvents/swnw_bottles.webp" },
      { type: "video", src: "/BrodyEvents/swnw_hype.mp4" },
    ],
    venue: "Somewhere Nowhere",
    city: "New York, NY",
    format: "headliner",
    context:
      "Somewhere Nowhere is a boutique experience space and rooftop venue in New York City. A 4th of July show — outdoor, summer energy, long set across the afternoon into the night. One of the first significant New York bookings.",
  },
  {
    id: "event101",
    slug: "looneys-pub-sep-2023",
    title: "Looney's Pub (College Park)",
    date: "September 2023",
    description: "Opening + Closing for Jake Shore",
    media: [{ type: "video", src: "/BrodyEvents/jake_shore_2.mp4" }],
    venue: "Looney's Pub",
    city: "College Park, MD",
    format: "open + close",
    headliners: ["Jake Shore"],
    context:
      "Looney's Pub is a College Park dive bar and live music venue close to the UMD campus. Opening and closing for Jake Shore was one of the first significant local bookings — a hometown-adjacent show that served as a proof of concept for what the DJ side of things could become.",
    links: [
      { label: "jake shore", href: "https://www.instagram.com/jakeshoremusic" },
    ],
  },
];
