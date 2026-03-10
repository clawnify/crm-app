import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "./index";

if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ root: "./dist", path: "index.html" }));
}

const port = parseInt(process.env.PORT || "3003", 10);
console.log(`CRM API running at http://localhost:${port}`);
serve({ fetch: app.fetch, port });
