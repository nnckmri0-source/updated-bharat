// ============================================================================
// SANITY STUDIO CONFIG
// ---------------------------------------------------------------
// This file is used by the Sanity Studio (`npx sanity dev` / `npx sanity build`)
// and by the site's content layer. It is currently NOT live — the site still
// uses the localStorage store. To go live:
//   1. `npm install sanity @sanity/vision next-sanity`
//   2. Create a project at sanity.io and paste the project id below.
//   3. Add `NEXT_PUBLIC_SANITY_PROJECT_ID` + `SANITY_API_TOKEN` to .env
//   4. Run `npx sanity deploy` (or `npx sanity start` for local studio).
// Then flip `USE_SANITY` to true in `src/lib/content-source.ts`.
// ============================================================================

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemas";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "your-project-id";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export default defineConfig({
  name: "updated-bharat",
  title: "Updated Bharat CMS",
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
});
