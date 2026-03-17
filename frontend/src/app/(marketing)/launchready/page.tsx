import type { Metadata } from "next";
import { LaunchReadyApp } from "@/components/launchready/LaunchReadyApp";

export const metadata: Metadata = {
  title: "LaunchReady — Free Launch Checklist for Indie Hackers | ShipProof",
  description:
    "Interactive multi-platform launch checklist. Plan your Product Hunt, Reddit, Hacker News, Twitter, and IndieHackers launch in minutes. Free forever.",
  openGraph: {
    title: "LaunchReady — Your Launch Day Co-Pilot",
    description:
      "Free interactive launch checklist for Product Hunt, Reddit, HN, Twitter & IndieHackers.",
    url: "https://shipproof.io/launchready",
  },
};

export default function LaunchReadyPage() {
  return <LaunchReadyApp />;
}
