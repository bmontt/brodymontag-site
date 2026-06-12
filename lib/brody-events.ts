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
    id: "event_afterdark",
    slug: "after-dark-above-ten-aug-2026",
    title: "After Dark · Above Ten (Brooklyn)",
    date: "August 2026",
    description: "Headline debut",
    media: [],
    venue: "After Dark",
    city: "Brooklyn, NY",
    format: "headliner",
    promoter: "Above Ten",
    promoterUrl: "https://www.instagram.com/aboveten",
    context:
      "After Dark is the Brooklyn party series run by Above Ten. A first headline booking — carrying a full New York night start to finish rather than warming the room for someone else, and the point where the work moves from support slots to leading the bill.",
    links: [{ label: "above ten", href: "https://www.instagram.com/aboveten" }],
  },
  {
    id: "event_echostage",
    slug: "echostage-sep-2025",
    title: "Echostage (DC)",
    date: "September 2025",
    description: "TWINSICK's Good Company Tour — on the bill as PB&J",
    media: [],
    venue: "Echostage",
    city: "Washington, DC",
    format: "opening set",
    headliners: ["TWINSICK", "Sunday Scaries", "MOONLGHT", "Jake Shore"],
    promoter: "Club Glow",
    promoterUrl: "https://www.instagram.com/clubglow",
    context:
      "Echostage is a ~3,000-capacity room in Northeast DC — repeatedly ranked the #1 club in the United States in DJ Mag's Top 100 Clubs poll, and owned by Insomniac alongside Club Glow and Soundcheck. This was TWINSICK's Good Company Tour headline date, with PB&J on the official bill alongside MOONLGHT, Sunday Scaries, and Jake Shore. The largest room on the calendar to date.",
    links: [
      { label: "echostage", href: "https://www.echostage.com" },
      { label: "event", href: "https://echostage.com/events/twinsick-good-company-tour-2025-september-19/" },
    ],
  },
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
      "Martin Ikin is one of UK house's most established names — a Toolroom Records mainstay, trained jazz pianist, and Beatport's best-selling artist of 2020. Open-to-close alongside him at Zebbie's Garden covered the full arc of the night: early crowd-building through to a late peak-time close.",
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
    description: "Direct support for Veggi",
    media: [
      { type: "image", src: "/BrodyEvents/veggi_empty.webp" },
      { type: "video", src: "/BrodyEvents/veggi_1.mp4" },
    ],
    venue: "Flash",
    city: "Washington, DC",
    format: "direct support",
    headliners: ["Veggi"],
    context:
      "Flash is one of DC's most respected underground clubs — a Funktion-One club room, a ground-floor bar, and the Green Room rooftop with its retractable top. VEGGI is an LA-based producer and DJ who fuses house, hip-hop, and indie into a genreless sound, with roots in viral production videos before the move into club and festival rooms. Direct support — the slot just beneath the headliner. A competing Club Glow show the same night drew the room lighter than a usual Flash booking, but the crowd that came stayed locked in, and the set held.",
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
      "Biscits (Luke Wright Jones) is a UK DJ and producer working at the center of modern tech house — he broke out with \"Do It Like This\" on Sonny Fodera's SOLOTOKO imprint. Soundcheck draws large crowds for international headliners; this was open-to-close on a sold-out night.",
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
      "The artspace series is a recurring circuit of NYC art-space showcases — smaller capacities, longer sets, a crowd that comes for the music. The opposite end of the spectrum from the large Club Glow bookings: lower production, more room to experiment. A consistent place to test sounds that wouldn't land in a festival context.",
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
      "Power Plant Live! is a large entertainment complex in Baltimore's Inner Harbor — a cluster of bars and venues that scales up its production on major nights. The Halloween mainstage was an outdoor stage to a large crowd, coordinated through the Club Glow network.",
  },
  {
    id: "event98",
    slug: "soundcheck-ownboss-sep-2024",
    title: "Soundcheck (DC)",
    date: "September 2024",
    description: "Opening for Öwnboss",
    media: [
      { type: "image", src: "/BrodyEvents/ownboss_focused.webp" },
      { type: "image", src: "/BrodyEvents/silvertone_duo.webp" },
    ],
    venue: "Soundcheck",
    city: "Washington, DC",
    format: "opening set",
    headliners: ["Öwnboss"],
    promoter: "Club Glow",
    promoterUrl: "https://www.instagram.com/clubglow",
    context:
      "Öwnboss (Eduardo Fornasa Zaniolo) is a Brazilian DJ and producer and one of Brazil's most-streamed dance acts — his \"Move Your Body\" with Sevek was among the most-played tracks in the world in 2022, and stays a peak-time staple worldwide. An early Soundcheck booking, and the start of a steady run of slots through the Club Glow pipeline.",
    links: [{ label: "öwnboss", href: "https://www.instagram.com/ownboss" }],
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
      "Somewhere Nowhere is a boutique experience space and rooftop venue in New York City. A 4th of July show — outdoors, a long set running from afternoon into the night. One of the first significant New York bookings.",
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
      "Looney's Pub is a College Park dive bar and live music venue close to the UMD campus. Opening and closing for Jake Shore was one of the first significant local bookings — a hometown-adjacent show, and an early sign of what the DJ side could become.",
    links: [
      { label: "jake shore", href: "https://www.instagram.com/jakeshoremusic" },
    ],
  },
];
