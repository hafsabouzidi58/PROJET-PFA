import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // <-- Ajoute cette ligne si tu veux un export statique HTML (génèrera un dossier "out")
  /* tes autres configurations si existantes */
};
export default nextConfig;
