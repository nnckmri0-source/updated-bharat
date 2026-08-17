import { defineType, defineField } from "sanity";

// Single "singleton" document holding site-wide settings (header, footer,
// social links, live URL, ad codes, OneSignal app id, notification bell).
export const settings = defineType({
  name: "settings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Site name", type: "string" }),
    defineField({ name: "tagline", title: "Tagline", type: "string" }),
    defineField({ name: "logo", title: "Logo", type: "image" }),
    defineField({ name: "footerAbout", title: "Footer about text", type: "text", rows: 3 }),
    defineField({ name: "copyright", title: "Copyright line", type: "string" }),
    defineField({ name: "liveUrl", title: "Live stream URL (YouTube)", type: "url" }),
    defineField({
      name: "social",
      title: "Social links",
      type: "object",
      fields: [
        { name: "facebook", title: "Facebook", type: "url" },
        { name: "twitter", title: "X (Twitter)", type: "url" },
        { name: "instagram", title: "Instagram", type: "url" },
        { name: "youtube", title: "YouTube", type: "url" },
        { name: "whatsapp", title: "WhatsApp", type: "url" },
      ],
    }),
    defineField({
      name: "adsense",
      title: "Google AdSense",
      type: "object",
      description: "Paste your AdSense codes here — the site renders them automatically.",
      fields: [
        {
          name: "autoAdClient",
          title: "Auto ads client id",
          type: "string",
          description: "The ca-pub-XXXX id from your AdSense account. Enables Google Auto Ads.",
        },
        {
          name: "autoAdSlot",
          title: "Auto ads slot",
          type: "string",
          description: "Optional slot id shown together with auto ads.",
        },
        {
          name: "headerCode",
          title: "Header script code",
          type: "text",
          rows: 6,
          description: "Full <script> tag(s) AdSense gives you to paste in <head>.",
        },
        {
          name: "inArticleCode",
          title: "In-article ad code",
          type: "text",
          rows: 6,
          description: "Manual ad unit code shown inside article body.",
        },
        {
          name: "sidebarCode",
          title: "Sidebar ad code",
          type: "text",
          rows: 6,
          description: "Manual ad unit code shown in the right sidebar.",
        },
      ],
    }),
    defineField({
      name: "onesignal",
      title: "OneSignal (push notifications)",
      type: "object",
      fields: [
        {
          name: "appId",
          title: "App ID",
          type: "string",
          description: "OneSignal App ID (one_XXXX...). Enables the web push subscribe prompt.",
        },
        {
          name: "safariId",
          title: "Safari web id (optional)",
          type: "string",
        },
      ],
    }),
  ],
});
