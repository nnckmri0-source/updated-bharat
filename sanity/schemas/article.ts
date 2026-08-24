import { defineType, defineField } from "sanity";

// News article. `body` is Portable Text so the admin can drop images AND
// YouTube embeds anywhere between paragraphs — exactly what the site renders.
export const article = defineType({
  name: "article",
  title: "News Article",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "channel",
      title: "Channel",
      type: "reference",
      to: [{ type: "channel" }],
    }),
    defineField({
      name: "date",
      title: "Published date",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "description",
      title: "Description (SEO + excerpt)",
      type: "text",
      rows: 3,
      description: "Short 150-160 char summary shown under title and in SEO. Also used as article excerpt.",
      validation: (Rule) => Rule.max(320),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alt text", type: "string", description: "For accessibility & SEO" }),
        defineField({ name: "caption", title: "Caption", type: "string" }),
      ],
      // Sanity CDN compresses/resizes automatically on the frontend via
      // ?w= & ?auto=format — storage stays small because we always request
      // the size we need instead of storing huge originals.
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H1", value: "h1" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
              { title: "Underline", value: "underline" },
              { title: "Strike", value: "strike-through" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [{ name: "href", type: "url", title: "URL" }],
              },
            ],
          },
        },
        {
          type: "image",
          title: "Inline image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "caption", title: "Caption", type: "string", description: "Shown below image" }),
            defineField({ name: "alt", title: "Alt text", type: "string", description: "For accessibility" }),
          ],
        },
        {
          type: "object",
          name: "youtube",
          title: "YouTube video",
          fields: [
            defineField({
              name: "url",
              title: "YouTube URL",
              type: "url",
              description: "Paste any YouTube link — e.g. https://www.youtube.com/watch?v=abc123",
              validation: (Rule) => Rule.required(),
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "published",
      title: "Visible on site",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "date" },
  },
});
