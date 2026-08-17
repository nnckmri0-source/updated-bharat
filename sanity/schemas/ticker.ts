import { defineType, defineField } from "sanity";

// Breaking ticker + trending keywords (one document, array fields).
export const ticker = defineType({
  name: "ticker",
  title: "Ticker & Trending",
  type: "document",
  fields: [
    defineField({
      name: "items",
      title: "Breaking news (ticker)",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "trending",
      title: "Trending keywords",
      type: "array",
      of: [{ type: "string" }],
    }),
  ],
});
