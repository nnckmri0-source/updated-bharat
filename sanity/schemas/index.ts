// Sanity schema registry — every content type the site renders.
// Each schema mirrors the localStorage store types so switching sources
// later is a drop-in change (see src/lib/content-source.ts).
import { article } from "./article";
import { channel } from "./channel";
import { story } from "./story";
import { edition } from "./edition";
import { poll } from "./poll";
import { settings } from "./settings";
import { ticker } from "./ticker";
import { adSlot } from "./adSlot";

export const schemaTypes = [article, channel, story, edition, poll, settings, ticker, adSlot];
