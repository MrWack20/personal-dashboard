import type { MetadataRoute } from "next";

const title = process.env.NEXT_PUBLIC_DASHBOARD_TITLE || "Joaquin's Command Center";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: title,
    short_name: "Command Center",
    description: "Personal dashboard — sales, inventory & Pokémon investing.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d0f14",
    theme_color: "#0d0f14",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
