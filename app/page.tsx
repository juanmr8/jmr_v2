import { DesktopHome } from "./home-desktop";
import { MobileHome } from "./home-mobile/mobile-home";
import { HomeRouter } from "./home-router";

/**
 * Home — one route, two forms. The branch happens on the client (matchMedia,
 * <760px → mobile) so only one form mounts its WebGL canvas. Both layouts are
 * built here as elements and handed to HomeRouter, which renders just one.
 */
export default function Home() {
  return <HomeRouter desktop={<DesktopHome />} mobile={<MobileHome />} />;
}
