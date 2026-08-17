import { defineType, defineField } from "sanity";

// Banner ad slots — each one is an image (or code) rendered at a spot on the site.
export const adSlot = defineType({
  name: "adSlot",
  title: "Ad Slot",
  type: "document",
  fields: [
    defineField({
      name: "key",
      title: "Slot key",
      type: "string",
      description: "afterTitle / afterAuthor / inArticle / beforeShare / sidebar / home",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Banner image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "link",
      title: "Click-through URL",
      type: "url",
    }),
    defineField({
      name: "code",
      title: "HTML code (optional)",
      type: "text",
      rows: 5,
      description: "Paste an AdSense/third-party ad snippet to override the image.",
    }),
    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "key" },
  },
});
