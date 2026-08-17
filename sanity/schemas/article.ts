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
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
      // Sanity CDN compresses/resizes automatically on the frontend via
      // ?w= & ?auto=format — storage stays small because we always request
      // the size we need instead of storing huge originals.
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "image",
          title: "Inline image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
            }),
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
