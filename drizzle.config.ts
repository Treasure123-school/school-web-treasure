import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "file:./server/data/app.db", // SQLite database file in dedicated server folder
  },
  verbose: true,
});
