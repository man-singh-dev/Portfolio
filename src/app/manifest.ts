import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Man Singh: systems + vision",
    short_name: "Man Singh",
    start_url: ".",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
