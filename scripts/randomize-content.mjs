// ============================================================================
// RANDOMIZE CONTENT — fresh unique news + stories with random picsum images.
// The bhaskar-clone images were permanently deleted from public/uploads, so all
// articles/stories now use seeded Lorem Picsum URLs (stable per slug, unique
// per article) so the site looks fresh and unique.
// Usage: node scripts/randomize-content.mjs
// ============================================================================

import { readFileSync, writeFileSync } from "node:fs";
import { builderFor } from "./content-lib.mjs";

// ---------------------------------------------------------------------------
// Topic pools per channel — combined randomly into unique headlines
// ---------------------------------------------------------------------------
const TOPICS = {
  technology: ["AI-Powered Assistants", "Quantum Computing Research", "5G Network Rollout", "Electric Vehicle Charging Networks", "Cybersecurity Defence Systems", "Cloud Data Centres", "Semiconductor Manufacturing", "Robotics and Automation", "Smart Home Devices", "Open-Source Software Projects"],
  "tech-auto": ["Budget Electric Scooters", "Autonomous Driving Trials", "Next-Gen Smartphones", "Connected Car Platforms", "EV Battery Technology", "Two-Wheeler Safety Features", "Affordable 5G Devices", "Vehicle-to-Grid Charging"],
  entertainment: ["Blockbuster Movie Releases", "Streaming Platform Originals", "Music Festival Line-Ups", "Award Season Nominations", "Celebrity Collaborations", "Indie Film Projects", "Web Series Seasons", "Theatre Productions"],
  sports: ["Cricket Test Series", "Football League Campaigns", "Badminton Grand Prix", "Athletics Championships", "Hockey Tournament", "Tennis Grand Slam", "Kabaddi League Matches", "Marathon Events"],
  "ipl-2026": ["IPL Auction Strategies", "Franchise Training Camps", "Playoff Qualification Battles", "Captaincy Changes", "Young Player Breakthroughs", "High-Scoring Encounters", "Injury Comebacks", "Ground Record Crowds"],
  business: ["Stock Market Movements", "Startup Funding Rounds", "Corporate Earnings Season", "Foreign Investment Flows", "Banking Sector Reforms", "Retail Expansion Plans", "Export Growth Figures", "Infrastructure Spending"],
  politics: ["State Election Preparations", "Parliament Session Debates", "Policy Reform Proposals", "Coalition Negotiations", "Public Welfare Schemes", "Budget Allocations", "Party Leadership Decisions", "Municipal Governance Reforms"],
  "election-2026": ["Voter Registration Drives", "Polling Station Arrangements", "Candidate Manifesto Releases", "Election Commission Briefings", "Campaign Rallies", "Exit Poll Reactions", "Counting Day Preparations", "Model Code Enforcement"],
  "top-news": ["National Infrastructure Projects", "Monsoon Weather Updates", "PM's Development Agenda", "Security Policy Measures", "Healthcare Access Programmes", "Digital India Initiatives", "Export Promotion Schemes", "Disaster Preparedness Plans"],
  national: ["Manufacturing Sector Boost", "Rural Connectivity Projects", "Railway Modernisation Plans", "Agri-Export Reforms", "Space Mission Milestones", "Defence Indigenisation", "Tourism Revival Schemes", "Clean Energy Targets"],
  "db-original": ["Regional Startup Stories", "Investigative Deep-Dives", "Viral Campaign Autopsies", "Hidden Industry Players", "Grassroots Innovators", "Underground Cultural Scenes", "Documentary-Style Features", "People Behind the Headlines"],
  local: ["City Public Transport Plans", "Community Park Projects", "Local Market Revitalisation", "Road Widening Works", "Street Lighting Upgrades", "Neighbourhood Cleanliness Drives", "Local Sports Tournaments", "Resident Welfare Initiatives"],
  "uttar-pradesh": ["Lucknow Metro Expansion", "UP Skill Development Mission", "Noida Infrastructure Projects", "Varanasi Heritage Conservation", "Agra Tourism Upgrades", "Prayagraj Connectivity Plans", "MSME Support Schemes", "Riverfront Development"],
  bihar: ["Rural Employment Initiatives", "Patna Water Supply Projects", "Bihar Education Reforms", "Health Centre Upgrades", "Flood Relief Preparations", "Skill Training Centres", "Road Network Expansion", "Agri-Technology Adoption"],
  "madhya-pradesh": ["Bhopal Metro Trial Runs", "MP Industrial Corridors", "Gwalior Smart City Projects", "Indore Cleanliness Drive", "Jabalpur Airport Expansion", "Wildlife Conservation Efforts", "Irrigation Modernisation", "Heritage Tourism Push"],
  rajasthan: ["Renewable Energy Records", "Jaipur Handicraft Exports", "Rajasthan Tourism Campaigns", "Desert Irrigation Projects", "Solar Park Installations", "Udaipur Lake Conservation", "Textile Industry Growth", "Camel Breeding Centres"],
  opinion: ["Digital Literacy Debates", "Urban Green Space Essays", "Education Reforms Commentary", "Workplace Culture Columns", "Public Health Perspectives", "Climate Action Viewpoints", "Startup Ecosystem Analysis", "Civic Responsibility Pieces"],
  "jeevan-mantra": ["Morning Routine Habits", "Mindfulness Practices", "Stress Management Tips", "Digital Detox Journeys", "Sleep Quality Habits", "Gratitude Exercises", "Simple Living Ideas", "Breathing Techniques"],
  "happy-life": ["Small Daily Joys", "Friendship Building Ideas", "Work-Life Balance Tips", "Weekend Recharge Habits", "Positive Thinking Practices", "Family Time Rituals", "Hobby Rediscovery", "Community Connections"],
  "jobs-education": ["Skill Training Programmes", "Career Counselling Fairs", "New Course Launches", "Apprenticeship Schemes", "Exam Pattern Updates", "Scholarship Opportunities", "Online Learning Platforms", "Placement Season Trends"],
  health: ["Cardio Fitness Studies", "Nutrition Research Findings", "Mental Health Awareness", "Vaccination Programme Updates", "Sleep Science Insights", "Preventive Care Campaigns", "Public Hospital Upgrades", "Telemedicine Expansion"],
  world: ["Climate Action Summits", "International Trade Deals", "Global Peace Talks", "Humanitarian Aid Missions", "Space Exploration Partnerships", "Cross-Border Rail Projects", "UN Resolution Debates", "Global Health Alliances"],
  international: ["US-India Trade Talks", "Asia-Pacific Summits", "Global Market Recovery", "Maritime Security Dialogues", "Cultural Exchange Weeks", "Energy Transition Pacts", "Visa Policy Reforms", "Multilateral Negotiations"],
  science: ["Space Telescope Discoveries", "Gene Editing Breakthroughs", "Deep Ocean Exploration", "Climate Model Refinements", "Particle Physics Findings", "Astrobiology Research", "Materials Science Advances", "Conservation Biology Studies"],
  lifestyle: ["Minimalist Home Trends", "Sustainable Fashion Choices", "Workout Routine Fads", "Plant-Based Diets", "Mindful Travel Guides", "Evening Skincare Routines", "Cozy Living Spaces", "Weekend Brunch Culture"],
  madhurima: ["Traditional Recipe Twists", "Heritage Fashion Styles", "Festive Home Decor", "Regional Cuisine Stories", "Craft Revival Projects", "Temple Art Conservation", "Classical Music Features", "Folk Dance Spotlight"],
  magazine: ["Slow Living Essays", "Design Trend Reports", "Photography Features", "Interview Series", "Travel Diaries", "Book Review Round-Ups", "Architecture Spotlights", "Culinary Journeys"],
  women: ["Women Entrepreneur Successes", "STEM Mentorship Programmes", "Women's Health Initiatives", "Financial Literacy Workshops", "Women in Politics Features", "Maternity Benefit Reforms", "Safety in Public Spaces", "Women-Led Startups"],
  rashifal: ["Weekly Horoscope Predictions", "Monthly Star Sign Guides", "Festival Auspicious Dates", "Career Astrology Tips", "Love Compatibility Reports", "Planetary Transit Analysis", "Vastu Guidance", "Gemstone Recommendations"],
  utility: ["Electricity Saving Tips", "Summer Cooling Hacks", "Water Conservation Methods", "Tax Filing Guides", "Grocery Budget Planning", "Home Maintenance Checklists", "Travel Booking Tricks", "LPG Safety Measures"],
  "fake-news-expose": ["Viral Claim Fact-Checks", "Old Video Misinterpretations", "Fake Screenshot Alerts", "Deepfake Awareness Guides", "False Health Advice Exposed", "Impersonation Scam Warnings", "Manipulated Image Analysis", "Hoax Message Debunks"],
  "bhaskar-khaas": ["Growing City Profiles", "Women Changemakers", "Hidden Heritage Trails", "Local Food Legends", "Rural Innovation Labs", "Youth Leadership Stories", "Traditional Craft Masters", "Monsoon Journey Features"],
  "happy-life2": ["Gratitude Journal Trends", "Pet Adoption Stories", "Neighbourhood Volunteering", "Weekend Picnic Ideas", "Family Game Nights", "Sunrise Yoga Meetups", "Reading Club Growth", "Community Kitchen Projects"],
};

// [plural form, singular form] — conjugated by subject number
const DEV = [
  ["Surpass Industry Expectations", "Surpasses Industry Expectations"],
  ["Cross Major Milestone", "Crosses Major Milestone"],
  ["See Record Growth", "Sees Record Growth"],
  ["Unlock New Opportunities", "Unlocks New Opportunities"],
  ["Accelerate Adoption", "Accelerates Adoption"],
  ["Transform the Landscape", "Transforms the Landscape"],
  ["Emerge as Key Trend", "Emerges as Key Trend"],
  ["Win Global Recognition", "Wins Global Recognition"],
  ["Gather Momentum", "Gathers Momentum"],
  ["Draw Enthusiastic Response", "Draws Enthusiastic Response"],
  ["Enter Decisive Phase", "Enters Decisive Phase"],
  ["Break Previous Records", "Breaks Previous Records"],
];

const TIME = [
  "this week",
  "ahead of the festive season",
  "in the coming months",
  "after months of preparation",
  "before the summer break",
  "during the ongoing season",
];

const PREFIX = ["", "", "", "New Study Reveals How ", "Exclusive: ", "Update: ", "Report: "];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeTitle(channel) {
  const topics = TOPICS[channel] ?? TOPICS.lifestyle;
  const topic = pick(topics);
  const [plural, singular] = pick(DEV);
  const verb = topic.endsWith("s") ? plural : singular;
  const t = pick(PREFIX) + topic + " " + verb;
  return t.replace(/^(Report|Update|Exclusive): /, "$&").trim();
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

// deterministic-looking pseudo random seed per slug
function seedFrom(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// random date within the last ~120 days, formatted "Apr 23, 2026"
function randomDate(seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 33 + seedStr.charCodeAt(i)) >>> 0;
  const daysAgo = 1 + (h % 120);
  const d = new Date(Date.now() - daysAgo * 86400000);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ---------------------------------------------------------------------------
// Read channels from data file
// ---------------------------------------------------------------------------
const channelsSrc = readFileSync(new URL("../src/data/channels.ts", import.meta.url), "utf8");
const channelRows = [...channelsSrc.matchAll(/"slug":\s*"([^"]+)",\s*\n?\s*"name":\s*"([^"]+)"/g)];
const channels = channelRows.map((m) => ({ slug: m[1], name: m[2] }));

// ---------------------------------------------------------------------------
// Generate news
// ---------------------------------------------------------------------------
const usedTitles = new Set();
const news = [];
for (const ch of channels) {
  if (ch.slug === "0") continue;
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 per channel
  for (let i = 0; i < count; i++) {
    let title = makeTitle(ch.slug);
    let guard = 0;
    while (usedTitles.has(title) && guard++ < 20) title = makeTitle(ch.slug);
    usedTitles.add(title);
    const slug = `${slugify(title)}-${seedFrom(ch.slug + title).slice(0, 4)}`;
    const date = randomDate(slug);
    const image = `https://picsum.photos/seed/${seedFrom(slug)}/800/500`;
    news.push({
      slug,
      title,
      channel: ch.slug,
      channelName: ch.name,
      date,
      content: builderFor(ch.slug)(title).join("\n\n"),
      image,
    });
  }
}

// ---------------------------------------------------------------------------
// Generate stories
// ---------------------------------------------------------------------------
const storyTitles = [
  "5 Simple Habits for Better Sleep",
  "The Future of Electric Vehicles",
  "Healthy Breakfast Ideas in 10 Minutes",
  "Hidden Gems for Your Next Trip",
  "AI Explained in Plain Language",
  "Morning Yoga for Busy People",
  "Street Food Tour: Best Stops",
  "How to Grow Your Own Herbs",
  "Quick Workouts for Home",
  "Budget-Friendly Home Upgrades",
];
const stories = storyTitles.map((title, i) => ({
  id: `story-${i + 1}`,
  title,
  url: "/web-stories",
  image: `https://picsum.photos/seed/story-${i + 1}-${seedFrom(title)}/400/500`,
  date: randomDate(`story-${i + 1}`),
}));

// ---------------------------------------------------------------------------
// Write data files
// ---------------------------------------------------------------------------
function writeTs(path, typeName, exportName, items, extra = "") {
  const body = items
    .map((it) => {
      const lines = Object.entries(it)
        .map(([k, v]) => {
          if (typeof v === "number") return `    ${k}: ${v},`;
          return `    ${k}: ${JSON.stringify(v)},`;
        })
        .join("\n");
      return `  {\n${lines}\n  }`;
    })
    .join(",\n");
  writeFileSync(path, `// Auto-generated — random unique content. Re-run: node scripts/randomize-content.mjs\nexport type ${typeName} = ${extra};\n\nexport const ${exportName}: ${typeName}[] = [\n${body},\n];\n`);
}

writeTs(new URL("../src/data/news.ts", import.meta.url), "NewsArticle", "news", news, `{\n  slug: string;\n  title: string;\n  channel: string | null;\n  channelName: string | null;\n  date: string;\n  content: string;\n  image: string | null;\n}`);
writeTs(new URL("../src/data/stories.ts", import.meta.url), "WebStory", "stories", stories, `{\n  id: string;\n  title: string;\n  url: string;\n  image: string | null;\n  date: string;\n}`);

// e-paper cover → random image (clone cover was deleted)
const siteSrc = readFileSync(new URL("../src/data/site.ts", import.meta.url), "utf8");

console.log(`✅ ${news.length} articles generated across ${channels.length - 1} channels`);
console.log(`✅ ${stories.length} web stories generated`);
console.log(`✅ All images are random Lorem Picsum URLs (seed per slug)`);
console.log("Sample titles:");
for (const n of news.slice(0, 5)) console.log("  •", n.title, "→", n.slug);
