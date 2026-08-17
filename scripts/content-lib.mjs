// Shared content generation library used by write-content.mjs and seed-content.mjs

// ---------------------------------------------------------------------------
// Channel-aware article body builders
// ---------------------------------------------------------------------------
const builders = {
  technology: (title) => [
    `The news of ${title} has become the talk of the technology industry this week, drawing the attention of developers, startups and investors alike. Industry insiders say the shift has been building for months, and the latest update marks a clear turning point in how the sector approaches the problem.`,
    `Sources familiar with the matter say the move comes after extensive testing with early partners, who reported significant gains in speed, efficiency and overall reliability. Engineers describe the change as a natural next step rather than a sudden departure, with most core systems remaining backward-compatible so existing users face minimal disruption.`,
    `"This is exactly the kind of momentum the industry needed," said a senior technology analyst following the rollout. "The demand was always there — what was missing was a solution that could scale without adding complexity. That is precisely what this delivers." Early adoption numbers have already beaten internal projections by a wide margin.`,
    `Looking ahead, experts expect the impact to ripple across the wider ecosystem in the coming quarters. Product teams are believed to be planning follow-up releases, while enterprise customers weigh longer-term commitments. For everyday users, the immediate takeaway is simple: the experience is faster, safer and more reliable than ever before.`,
  ],
  entertainment: (title) => [
    `The news of ${title} has taken the entertainment world by storm, drawing record audiences within days of its release. Fans and critics alike have flooded social media with praise, and early reactions point to one of the most talked-about moments in recent memory.`,
    `The project brought together a well-known creative team that spent nearly two years in production, according to people close to the making. Multiple previews and screenings reportedly drew enthusiastic responses, and the final cut has been described by insiders as polished, ambitious and emotionally resonant.`,
    `"We knew we had something special when the first test audience sat in silence for the entire finale," a member of the production team said. "Moments like that don't happen by accident — they are the result of obsessive attention to detail." Reviewers have echoed the sentiment, praising both the performances and the storytelling.`,
    `With momentum this strong, the team is already exploring what comes next. Trade analysts say the success is likely to reshape scheduling decisions for the rest of the year, and fans are eagerly awaiting any announcement about a follow-up. For now, the message from the industry is unanimous: this is a landmark moment that will be remembered for years.`,
  ],
  sports: (title) => [
    `The news of ${title} dominated the sporting weekend, and the scenes that followed will be talked about for a long time. Players, coaches and supporters savoured a contest that had everything — drama, skill and raw emotion — and the result has reshuffled expectations across the season.`,
    `The build-up to the contest was intense, with both sides carrying strong recent form into the fixture. Analysts had predicted a tight affair, and they were not wrong: momentum swung several times, and the final minutes produced moments of brilliance that drew roars from the stands and celebration across social media.`,
    `"The team showed incredible character tonight," the winning side's coach said afterwards. "We spoke before the game about staying calm in the big moments, and every single player delivered on that promise." Former players and pundits lined up to call it one of the best matches of the season so far.`,
    `Attention now turns to the next round of fixtures, with both teams aware that consistency will decide how the season ultimately unfolds. Fitness, squad depth and composure under pressure are expected to be the deciding factors, and supporters will hope the momentum carries forward. One thing is certain — this contest has set the bar for everything that follows.`,
  ],
  business: (title) => [
    `The news of ${title} has moved financial markets this week, with analysts updating their outlooks and investors reassessing positions across the sector. The announcement landed shortly after markets opened and quickly became the most-discussed story of the trading day.`,
    `Company officials described the development as part of a broader strategy that has been in the works for some time, citing stronger-than-expected demand and improving operational efficiency. Detailed figures released alongside the announcement showed healthy growth across most key segments, with management expressing confidence in the road ahead.`,
    `"This is a pivotal moment for the business," a senior executive said during the investor briefing. "The fundamentals are strong, our order book is healthy, and we believe the best years are still ahead of us." Market watchers largely welcomed the update, though some cautioned that execution would be the true test.`,
    `In the coming months, analysts will be watching the company's quarterly numbers closely to see whether the momentum translates into sustained results. For the broader economy, the development is being read as another sign of resilience, with businesses showing continued appetite to invest and expand despite an uncertain global backdrop.`,
  ],
  politics: (title) => [
    `The news of ${title} has dominated the political conversation this week, drawing reactions from leaders across the spectrum. The development was described by observers as significant, with implications likely to be felt well beyond the immediate news cycle.`,
    `According to officials familiar with the discussions, the matter has been under deliberation for several weeks, with extensive consultations held at various levels. Multiple rounds of talks reportedly produced broad agreement on the core principles, even as differences remained on specific details and timelines.`,
    `"This is a step in the right direction and one that reflects the concerns of ordinary people," a senior leader said in response. Opposition voices, while cautious, acknowledged the announcement while calling for more clarity on implementation. Political commentators noted that the coming weeks would reveal how the plan translates into action on the ground.`,
    `The focus now shifts to execution and oversight, with committees expected to review progress in the months ahead. Public reaction has been mixed but largely engaged, and the debate is expected to remain a central theme in the national conversation. For policymakers, the challenge will be turning the promise of today into visible change tomorrow.`,
  ],
  health: (title) => [
    `Medical experts are welcoming the news of ${title} as a meaningful step forward, with researchers saying the findings could open new avenues for patients and clinicians alike. The announcement, published after years of careful study, has generated considerable interest within the medical community.`,
    `The research involved a large team of scientists and clinicians who tracked outcomes over an extended period. Preliminary results showed encouraging signs across multiple measures, and the researchers were careful to note that further validation would be needed before any broad conclusions could be drawn.`,
    `"These findings are genuinely promising and deserve careful attention," said a senior physician involved in the review. "We are talking about outcomes that could change how we approach treatment for a significant number of people." Patient advocacy groups also responded positively while urging continued research and affordable access.`,
    `The next phase will involve larger studies to confirm the initial results and refine the approach. Clinicians advising the public recommend speaking with healthcare providers about what the development means in individual cases. For the wider field, the work adds to a growing body of evidence that progress in this area is accelerating.`,
  ],
  world: (title) => [
    `The news of ${title} has drawn international attention this week, with diplomats, officials and global observers closely following the latest developments. The situation is being described as delicate, with several nations engaged in discussions behind the scenes.`,
    `Reports from multiple capitals suggest weeks of quiet diplomacy preceded the latest public development. Officials involved in the talks described the atmosphere as constructive, noting that all sides had shown a willingness to keep channels of communication open even where differences remained.`,
    `"The important thing is that dialogue continues," a senior diplomat said. "Progress may be incremental, but every step keeps the door open for a durable solution." International bodies have called for restraint and for all parties to prioritise the interests of ordinary people affected by the situation.`,
    `In the weeks ahead, observers will watch for follow-up meetings and any signs of a broader agreement. Analysts caution that the path forward is unlikely to be straightforward, but they also note that sustained engagement has, in the past, paved the way for breakthroughs when it mattered most.`,
  ],
  science: (title) => [
    `The scientific community is buzzing over the news of ${title}, a development that researchers say could reshape how we understand a topic that has fascinated experts for years. The findings, released after a lengthy peer-review process, have already generated lively discussion in academic circles.`,
    `The work was carried out by an international collaboration of researchers, who combined decades of data with new analytical techniques. Their conclusions emerged only after a series of rigorous validation steps, and the team stressed that transparency and reproducibility had been at the heart of the project from the start.`,
    `"This changes our picture in a meaningful way," said the lead researcher. "It raises new questions, which is exactly what good science should do — it opens doors rather than closing them." Fellow scientists praised the rigor of the methodology, while noting that replication studies would be an important next step.`,
    `Beyond the immediate findings, the work is expected to influence teaching and future research directions for years to come. Funding agencies have already signalled interest in supporting follow-up studies, and the wider public has responded with curiosity. If confirmed by further work, this could rank among the more consequential contributions of the decade.`,
  ],
  lifestyle: (title) => [
    `The news of ${title} has become one of the most talked-about lifestyle topics this season, with social media, publications and everyday conversations all taking notice. Enthusiasts say the trend reflects a broader shift in how people think about their daily routines and personal choices.`,
    `Early adopters describe the movement as being as much about mindset as it is about habit. "It is not about perfection — it is about making small changes that actually fit your life," said one longtime follower of the trend. Experts who have studied similar shifts note that flexibility is usually the secret to lasting change.`,
    `Nutritionists and wellness professionals have weighed in with a broadly supportive view, advising people to approach the trend in a way that suits their own circumstances. The consensus seems to be that moderation, consistency and enjoyment matter far more than rigid rules.`,
    `As the trend continues to spread, brands and creators are racing to offer their own takes, and communities are forming around shared ideas and experiences. Whether it becomes a permanent part of everyday life or fades with the season, it has already left its mark on the conversation — and given plenty of people a fresh reason to try something new.`,
  ],
  education: (title) => [
    `The news of ${title} has become a major talking point for students, parents and educators, with many welcoming the development as a positive step for the sector. The announcement follows months of consultation and has been met with cautious optimism in academic circles.`,
    `Under the plan, institutions will see a series of practical changes designed to make learning more accessible and outcomes more transparent. Officials said the measures were shaped by feedback from thousands of students and teachers, and that early implementation would focus on the areas with the greatest impact.`,
    `"This is about putting students at the centre of everything we do," an education department spokesperson said. "Every decision was tested against one simple question — does it help a young person learn and grow?" Representatives of student bodies welcomed the direction while calling for clear timelines and adequate resources.`,
    `Institutions are now preparing for the rollout, with training and support programmes being readied for the months ahead. Families are advised to stay informed through official channels, while educators see the moment as an opportunity to modernise how knowledge is shared. If the rollout matches the ambition, the benefits could be felt across the system for years.`,
  ],
  local: (title) => [
    `The news of ${title} has drawn widespread attention across the city this week, with residents and civic leaders both weighing in on the development. Local officials described the moment as significant and pledged that work would continue to address the issues that matter most to the community.`,
    `The initiative follows months of groundwork by municipal teams, who consulted residents, businesses and community groups before finalising the approach. Details released to the public show a clear focus on practical improvements, with priority given to areas that have faced long-standing challenges.`,
    `"This is the result of the whole community pulling in the same direction," a civic leader said at the announcement. "When residents, officials and local businesses work together, that is when real change happens." Residents interviewed by local reporters expressed cautious optimism, saying they would judge the effort by its results on the ground.`,
    `In the coming months, progress will be reviewed publicly at regular intervals, with residents encouraged to share feedback as work proceeds. While challenges remain, the mood in the city is noticeably more hopeful than it was a year ago. For many, this marks the beginning of a new chapter for the community.`,
  ],
  default: (title) => [
    `The news of ${title} has emerged as a major talking point this week, drawing attention from experts, commentators and the public alike. The development was described by observers as significant, with implications expected to unfold over the coming weeks.`,
    `Detailed information released alongside the announcement painted a fuller picture of the background and the thinking behind it. Those involved said the process had been careful and consultative, with input gathered from a wide range of voices before any final decisions were made.`,
    `"This is a moment people will remember," said one observer closely following the story. "The groundwork has been laid, and now it is about delivering on the promise." Reactions have been broadly positive, with calls for transparency and steady follow-through.`,
    `Attention will now turn to implementation, with updates expected in the weeks ahead. Analysts say the true measure of success will be the difference it makes in people's daily lives. For now, the prevailing mood is one of quiet optimism and expectation.`,
  ],
};

// map a channel slug to the most fitting body builder
const BUILDER_MAP = {
  technology: "technology",
  "tech-auto": "technology",
  entertainment: "entertainment",
  sports: "sports",
  "ipl-2026": "sports",
  business: "business",
  politics: "politics",
  "election-2026": "politics",
  "top-news": "politics",
  national: "politics",
  "bhaskar-khaas": "politics",
  "db-original": "default",
  health: "health",
  "happy-life": "health",
  world: "world",
  international: "world",
  science: "science",
  lifestyle: "lifestyle",
  "jeevan-mantra": "lifestyle",
  madhurima: "lifestyle",
  magazine: "lifestyle",
  utility: "lifestyle",
  rashifal: "lifestyle",
  education: "education",
  "jobs-education": "education",
  women: "education",
  local: "local",
  "uttar-pradesh": "local",
  bihar: "local",
  "madhya-pradesh": "local",
  rajasthan: "local",
  opinion: "default",
  "fake-news-expose": "default",
};

export function builderFor(channel) {
  const key = (channel || "").toLowerCase();
  return builders[BUILDER_MAP[key] ?? "default"];
}

export function buildContent(channel, title) {
  return builderFor(channel)(title);
}

// ---------------------------------------------------------------------------
// Seed titles — two per channel for channels that start empty
// ---------------------------------------------------------------------------
export const SEED_TITLES = {
  local: ["City Council Approves Major Public Transport Upgrade", "New Community Park Opens to Public This Weekend"],
  "election-2026": ["Election Commission Announces Revised Polling Schedule", "Voter Awareness Drive Reaches Rural Districts"],
  "ipl-2026": ["IPL 2026: High-Scoring Thriller Decided in Final Over", "IPL 2026 Team Preview: Form Guide Ahead of the Playoffs"],
  "db-original": ["Special Investigation: Inside the Rise of Regional Startups", "DB Original: The Untold Story Behind a Viral Campaign"],
  "uttar-pradesh": ["UP Government Launches New Skill Development Mission", "Lucknow Metro Expansion Gets Green Signal"],
  opinion: ["Opinion: Why Digital Literacy Is the Need of the Hour", "Opinion: The Case for Cleaner, Greener Cities"],
  "jeevan-mantra": ["Jeevan Mantra: Simple Habits for a Calmer, Healthier Life", "Jeevan Mantra: The Power of a Steady Morning Routine"],
  "jobs-education": ["Government Announces New Skill Training for Youth", "Top Careers in 2026: Courses That Lead to Jobs"],
  "tech-auto": ["Electric Two-Wheeler Prices Drop as Battery Costs Fall", "New Budget Smartphone Packs Flagship-Level Features"],
  "top-news": ["PM Announces Major Infrastructure Push for States", "Nationwide Weather Advisory Issued Ahead of Monsoon"],
  national: ["New National Policy Aims to Boost Manufacturing", "Rural Connectivity Project Crosses Halfway Mark"],
  "fake-news-expose": ["Fact Check: Viral Claim About New Tax Rule Is False", "Fake News Exposed: Old Video Shared as Recent Incident"],
  bihar: ["Bihar Launches New Rural Employment Initiative", "Patna Gets Modern Water Treatment Plant"],
  "bhaskar-khaas": ["Bhaskar Khaas: Inside India's Fastest Growing Cities", "Bhaskar Khaas: The Women Leading Change in Small Towns"],
  madhurima: ["Madhurima: Traditional Recipes Get a Modern Twist", "Madhurima: Festive Looks Inspired by Heritage Styles"],
  "madhya-pradesh": ["MP Government Announces New Industrial Corridor", "Bhopal Metro Trial Run Begins Successfully"],
  magazine: ["Magazine: The Art of Slow Living in a Fast World", "Magazine: Design Trends That Will Define 2026"],
  utility: ["Utility: How to Save on Your Monthly Electricity Bill", "Utility: Simple Steps to Keep Your Home Cool This Summer"],
  rajasthan: ["Rajasthan Sets Record for Renewable Energy Generation", "Jaipur Hosts Major Handicraft Export Fair"],
  rashifal: ["Rashifal: What the Stars Predict for Your Week Ahead", "Rashifal 2026: Your Yearly Horoscope Guide"],
  "happy-life": ["Happy Life: The Science of Small Daily Joys", "Happy Life: Building Friendships in a Busy World"],
  international: ["Global Leaders Agree on New Climate Action Framework", "International Markets Recover as Trade Talks Progress"],
  women: ["Women Entrepreneurs Drive Growth in Small Businesses", "New Programme Supports Women in STEM Careers"],
};

// fallback titles for any channel not listed above
export const FALLBACK_TITLES = [
  "Fresh Update: Everything You Need to Know This Week",
  "Inside Story: How the Latest Development Unfolded",
];
