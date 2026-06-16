"use client";
import { useEffect } from "react";

// Locks page scroll for the whole /projects/* route group. Deliberately does
// NOT wrap children in <ReactLenis> (unlike the homepage) — this route
// intercepts wheel/touch itself to drive the WebGL gallery.
export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      // Restore so navigating back to the Lenis homepage still scrolls.
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  // Full-viewport, non-scrolling shell for every /projects/* page. The gallery
  // is driven by intercepted wheel/touch input, so this must never scroll
  // natively: overscroll-none kills rubber-band/chaining, touch-none hands
  // touch to our own handlers.
  return (
    <div className="fixed inset-0 h-[100dvh] w-screen touch-none overflow-hidden overscroll-none bg-[#e9e6df]">
      {children}
    </div>
  );
}
