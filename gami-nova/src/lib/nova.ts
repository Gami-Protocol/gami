/**
 * Nova's reply engine. Fully client-side and canned for now — the chat
 * surface and XP loop are the deliverable; swap this for a real model call
 * (or the Gami agent backend) without touching the UI.
 */

const GREETINGS = [
  "Hey, I'm Nova. Tell me what you're up to and I'll turn it into XP.",
  "Nova here. Chat with me, earn XP, climb the board — that's the whole game.",
];

const QUEST_PROMPTS = [
  "Want a quick quest? Describe one thing you shipped today — I'll log it.",
  'Daily check-in: what are you playing or building right now?',
  "Tell me your favorite Gami feature and I'll mark today's streak.",
];

const ACKS = [
  "Logged. That's XP in the bank.",
  'Nice — XP added, streak ticking up.',
  'Got it. Nova never forgets a grind session.',
  "That's worth it. XP credited.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function novaGreeting(): string {
  return pick(GREETINGS);
}

export function novaReplyTo(userText: string): string {
  const text = userText.trim();
  if (/\bquest|mission|daily\b/i.test(text)) {
    return `${pick(ACKS)} Here's today's quest bonus — nice instinct to go looking for one.`;
  }
  if (text.length < 12) {
    return `${pick(ACKS)} Give me a bit more next time and the XP bonus gets bigger.`;
  }
  if (/\?$/.test(text)) {
    return `Good question. I log XP either way, but here's a prompt back: ${pick(QUEST_PROMPTS)}`;
  }
  return `${pick(ACKS)} ${pick(QUEST_PROMPTS)}`;
}
