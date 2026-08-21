import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DEV ONLY (ignored in production builds): the Chrome verification extension reaches the dev
  // server over the LAN IP, not localhost (see CLAUDE.md "Verification environment"). Next dev
  // blocks cross-origin access to /_next/* dev resources by default, which breaks HMR + client
  // hydration for those LAN-IP loads. Allow-listing the LAN hosts restores the documented workflow.
  allowedDevOrigins: ["192.168.7.22", "192.168.7.26"],
};

export default nextConfig;
