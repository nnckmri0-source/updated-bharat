import { defineType, defineField } from "sanity";

export const story = defineType({
  name: "story",
  title: "Web Story",
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
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      description: "Used for /visualstories/{slug} — e.g. iphone-17e-deal",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      description: "e.g. Technology, Lifestyle — shown as badge on story",
    }),
    defineField({
      name: "description",
      title: "Short description",
      type: "text",
      rows: 2,
      description: "Shown in story grid and as slide subtitle",
    }),
    defineField({
      name: "image",
      title: "Cover Image (9:16)",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({ name: "alt", title: "Alt text", type: "string" }),
      ],
    }),
    defineField({
      name: "slides",
      title: "Story Slides (IndiaToday style)",
      type: "array",
      description: "Each slide = one vertical story page (image + caption). IndiaToday shows 4-10 slides per story.",
      of: [
        {
          type: "object",
          name: "slide",
          title: "Slide",
          fields: [
            defineField({ name: "image", title: "Slide Image (9:16 recommended)", type: "image", options: { hotspot: true }, validation: (Rule) => Rule.required() }),
            defineField({ name: "title", title: "Slide Title", type: "string", description: "Bold heading on slide" }),
            defineField({ name: "caption", title: "Caption / Description", type: "text", rows: 2, description: "Shown below title on slide" }),
            defineField({ name: "alt", title: "Alt text", type: "string" }),
          ],
          preview: {
            select: { title: "title", media: "image" },
          },
        },
      ],
    }),
    defineField({
      name: "link",
      title: "External Link (legacy)",
      type: "url",
      hidden: true,
      description: "Where the story points — leave empty to open the story viewer.",
    }),
    defineField({
      name: "published",
      title: "Visible on site",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "category" },
  },
});
