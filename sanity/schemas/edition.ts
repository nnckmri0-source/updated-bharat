import { defineType, defineField } from "sanity";

export const edition = defineType({
  name: "edition",
  title: "E-Paper Edition",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "string",
    }),
    defineField({
      name: "cover",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "pdf",
      title: "PDF link",
      type: "url",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "date" },
  },
});
