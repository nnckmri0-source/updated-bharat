import { defineType, defineField } from "sanity";

export const poll = defineType({
  name: "poll",
  title: "Poll",
  type: "document",
  fields: [
    defineField({
      name: "question",
      title: "Question",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "options",
      title: "Options",
      type: "array",
      of: [{ type: "string" }],
      validation: (Rule) => Rule.required().min(2).max(6),
    }),
    defineField({
      name: "published",
      title: "Visible on site",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "question" },
  },
});
