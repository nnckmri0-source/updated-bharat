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
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "url",
      description: "Where the story points — leave empty to open the story grid.",
    }),
    defineField({
      name: "published",
      title: "Visible on site",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "title" },
  },
});
