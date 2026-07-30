import { classifyEmail } from '../agents/geminiAgent.js';
import { extractVisibleText, extractPlainContent, countExternalLinks } from './htmlExtractor.js';

// ─── Layer 1: Rule-Based Scoring ───

const SPAM_KEYWORDS = [
  'urgent', 'winner', 'prize', 'lottery', 'claim', 'free money',
  'limited time', 'act now', 'verify your account', 'click here',
  'congratulations', 'you have been selected', 'million dollars',
  'bank transfer', 'no cost', 'risk free', 'guaranteed',
];

const JOB_KEYWORDS = [
  'interview', 'application', 'position', 'role', 'opportunity',
  'hiring', 'recruiter', 'offer letter', 'onboarding', 'job offer',
  'shortlisted', 'assessment', 'technical round', 'hr round',
  'joining date', 'resume', 'candidate', 'selection',
];

const TRUSTED_DOMAINS = [
  'google.com', 'gmail.com', 'linkedin.com', 'github.com',
  'microsoft.com', 'amazon.com', 'apple.com', 'naukri.com',
  'indeed.com', 'glassdoor.com', 'stackoverflow.com',
];

function calculateRuleScore(email) {
  let score = 0;
  const subject = (email.subject || '').toLowerCase();
  const rawBody = email.body || '';
  const from = (email.from || '').toLowerCase();

  // Extract clean visible text and plain content without URLs for keywords
  const visibleBody = extractVisibleText(rawBody);
  const plainBody = extractPlainContent(rawBody).toLowerCase();

  // Spam keywords in subject (+3 each)
  for (const keyword of SPAM_KEYWORDS) {
    if (subject.includes(keyword)) {
      score += 3;
      break; // Cap at one hit for keywords
    }
  }

  // Spam keywords in visible body (+1)
  for (const keyword of SPAM_KEYWORDS) {
    if (plainBody.includes(keyword)) {
      score += 1;
      break;
    }
  }

  // Extract sender domain
  const domainMatch = from.match(/@([\w.-]+)/);
  const senderDomain = domainMatch ? domainMatch[1] : '';

  // Unknown sender domain (+2)
  if (senderDomain && !TRUSTED_DOMAINS.some((d) => senderDomain.endsWith(d))) {
    score += 2;
  }

  // High uppercase ratio in visible body (+2)
  if (visibleBody.length > 50) {
    const upperCount = (visibleBody.match(/[A-Z]/g) || []).length;
    const ratio = upperCount / visibleBody.length;
    if (ratio > 0.15) score += 2;
  }

  // Too many actual external links (+2)
  const linkCount = countExternalLinks(rawBody);
  if (linkCount > 4) {
    score += 2;
  }

  // No-reply sender + generic subject (+1)
  if (from.includes('noreply') || from.includes('no-reply')) {
    if (!subject || subject.length < 10) score += 1;
  }

  // Trusted sender domain (-2)
  if (senderDomain && TRUSTED_DOMAINS.some((d) => senderDomain.endsWith(d))) {
    score -= 2;
  }

  // Gmail labeled INBOX, not SPAM (-3)
  if (email.labelIds && email.labelIds.includes('INBOX') && !email.labelIds.includes('SPAM')) {
    score -= 3;
  }

  return score;
}

// ─── Layer 2: Job/Interview Detection ───

function detectJobRelated(email) {
  const subject = (email.subject || '').toLowerCase();
  const rawBody = email.body || '';
  const visibleBody = extractVisibleText(rawBody).toLowerCase();
  const combined = `${subject} ${visibleBody}`;

  const matchedKeywords = JOB_KEYWORDS.filter((kw) => combined.includes(kw));

  if (matchedKeywords.length >= 2) {
    return {
      isJobRelated: true,
      matchedKeywords,
    };
  }
  return { isJobRelated: false, matchedKeywords: [] };
}

// ─── Layer 3: Gemini AI Classification (for ambiguous emails) ───

async function geminiClassify(email) {
  try {
    return await classifyEmail(email.subject, email.body);
  } catch {
    return null;
  }
}

// ─── Main Classification Pipeline ───

/**
 * Classify a single email through the 3-layer detection pipeline.
 * Returns: { tag, tagColor, tagEmoji, classification, confidence, details }
 */
export async function classifyEmailMessage(email, useAI = true) {
  const ruleScore = calculateRuleScore(email);
  const jobDetection = detectJobRelated(email);

  // Layer 2: Job/Interview always takes priority
  if (jobDetection.isJobRelated) {
    return {
      tag: 'JOB',
      tagColor: '#7B2FFF',
      tagEmoji: '💼',
      classification: 'JOB_RELATED',
      confidence: 0.9,
      priority: 'HIGH',
      details: `Job-related keywords: ${jobDetection.matchedKeywords.join(', ')}`,
    };
  }

  // Clear spam (score >= 4)
  if (ruleScore >= 4) {
    return {
      tag: 'SPAM',
      tagColor: '#FF3A3A',
      tagEmoji: '🔴',
      classification: 'SPAM',
      confidence: 0.85,
      priority: 'LOW',
      details: `Rule-based score: ${ruleScore}`,
    };
  }

  // Clear legitimate (score <= -2)
  if (ruleScore <= -2) {
    return {
      tag: 'REAL',
      tagColor: '#00FF88',
      tagEmoji: '🟢',
      classification: 'PERSONAL',
      confidence: 0.8,
      priority: 'NORMAL',
      details: `Rule-based score: ${ruleScore}`,
    };
  }

  // Ambiguous (score between -1 and 3) — use Gemini AI if allowed
  if (useAI) {
    const aiResult = await geminiClassify(email);
    if (aiResult) {
      const tagMap = {
        SPAM: { tag: 'SPAM', tagColor: '#FF3A3A', tagEmoji: '🔴', priority: 'LOW' },
        PHISHING: { tag: 'PHISHING', tagColor: '#FF3A3A', tagEmoji: '⚠️', priority: 'LOW' },
        PROMOTIONAL: { tag: 'PROMO', tagColor: '#FFD700', tagEmoji: '🟡', priority: 'LOW' },
        NEWSLETTER: { tag: 'PROMO', tagColor: '#FFD700', tagEmoji: '🟡', priority: 'LOW' },
        JOB_RELATED: { tag: 'JOB', tagColor: '#7B2FFF', tagEmoji: '💼', priority: 'HIGH' },
        PERSONAL: { tag: 'REAL', tagColor: '#00FF88', tagEmoji: '🟢', priority: 'NORMAL' },
        IMPORTANT: { tag: 'REAL', tagColor: '#00FF88', tagEmoji: '🟢', priority: 'HIGH' },
      };

      const mapped = tagMap[aiResult.classification] || tagMap.PERSONAL;
      return {
        ...mapped,
        classification: aiResult.classification,
        confidence: aiResult.confidence,
        details: aiResult.reason,
      };
    }
  }

  // Fallback for ambiguous scores when AI is bypassed or fails
  const tag = ruleScore > 0 ? 'PROMO' : 'REAL';
  const tagColor = ruleScore > 0 ? '#FFD700' : '#00FF88';
  const tagEmoji = ruleScore > 0 ? '🟡' : '🟢';
  const classification = ruleScore > 0 ? 'PROMOTIONAL' : 'PERSONAL';

  return {
    tag,
    tagColor,
    tagEmoji,
    classification,
    confidence: 0.6,
    priority: ruleScore > 0 ? 'LOW' : 'NORMAL',
    details: `Rule score: ${ruleScore}, AI bypassed/unavailable`,
  };
}
