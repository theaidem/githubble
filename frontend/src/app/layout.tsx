import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitHubble — GitHub stars and forks, live",
  description: "Explore public GitHub stars and forks in a continuously updated feed.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
