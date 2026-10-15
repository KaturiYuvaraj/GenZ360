import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

export function Page({
  children,
  bare = false,
}: {
  children: ReactNode;
  bare?: boolean;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Nav />
      <main>{children}</main>
      {bare ? null : <Footer />}
    </div>
  );
}
