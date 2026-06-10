export interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  media: Array<{ type: "image" | "video"; src: string; poster?: string }>;
}

export const events: Event[] = [
  {
    id: "event18",
    title: "Zebbie's Garden (DC)",
    date: "April 2025",
    description: "Opening + Closing for Martin Ikin",
    media: [
      { type: "image", src: "/BrodyEvents/ikin_trio.webp" },
      { type: "video", src: "/BrodyEvents/ikin_fiub.mp4" },
      { type: "video", src: "/BrodyEvents/ikin_percocet.mp4" },
    ],
  },
  {
    id: "event92",
    title: "Flash Rooftop (DC)",
    date: "September 2025",
    description: "Opening for Veggi",
    media: [
      { type: "image", src: "/BrodyEvents/veggi_empty.webp" },
      { type: "video", src: "/BrodyEvents/veggi_1.mp4" },
    ],
  },
  {
    id: "event93",
    title: "Soundcheck (DC)",
    date: "July 2025",
    description: "Opening + Closing for Biscits",
    media: [
      { type: "image", src: "/BrodyEvents/biscits_headshot.webp" },
      { type: "video", src: "/BrodyEvents/biscits_one_pill.mp4" },
      { type: "video", src: "/BrodyEvents/biscits_crazy.mp4" },
    ],
  },
  {
    id: "event95",
    title: "Public Art Space (NYC)",
    date: "June 2025",
    description: "",
    media: [
      { type: "video", src: "/BrodyEvents/art_space_gas_pedal.mp4" },
      { type: "video", src: "/BrodyEvents/art_space_freakuency.mp4" },
    ],
  },
  {
    id: "event97",
    title: "Power Plant Live! (Baltimore)",
    date: "October 2024",
    description: "Halloween mainstage set",
    media: [
      { type: "video", src: "/BrodyEvents/powerplant_pump_it.mp4" },
      { type: "video", src: "/BrodyEvents/powerplant_used_to_know.mp4" },
    ],
  },
  {
    id: "event98",
    title: "Soundcheck (DC)",
    date: "September 2024",
    description: "Opening for Ownboss",
    media: [
      { type: "image", src: "/BrodyEvents/ownboss_focused.webp" },
      { type: "image", src: "/BrodyEvents/silvertone_duo.webp" },
    ],
  },
  {
    id: "event99",
    title: "Somewhere Nowhere (NYC)",
    date: "July 2024",
    description: "4th of July rooftop set",
    media: [
      { type: "video", src: "/BrodyEvents/swnw_kill_bill.mp4" },
      { type: "image", src: "/BrodyEvents/swnw_bottles.webp" },
      { type: "video", src: "/BrodyEvents/swnw_hype.mp4" },
    ],
  },
  {
    id: "event101",
    title: "Looney's Pub (College Park)",
    date: "September 2023",
    description: "Opening + Closing for Jake Shore",
    media: [
      { type: "video", src: "/BrodyEvents/jake_shore_2.mp4" },
    ],
  },
];
