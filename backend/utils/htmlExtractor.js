/**
 * HTML-to-Text extraction utility for email processing.
 * 
 * Strips HTML tags, removes hidden content (display:none, visibility:hidden),
 * removes tracking pixels, style/script blocks, and extracts only the visible
 * human-readable text content that a user would actually see in their email client.
 */

/**
 * Extract visible text from an HTML email body.
 * This is critical for AI analysis — sending raw HTML causes Gemini to
 * misinterpret standard email HTML practices (display:none for responsive
 * design, tracking pixels, etc.) as "hidden phishing messages".
 */
export function extractVisibleText(html) {
  if (!html) return '';

  let text = html;

  // 1. Remove entire <style> blocks (contains display:none rules that confuse AI)
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // 2. Remove entire <script> blocks
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // 3. Remove HTML comments (often contain MSO conditionals, tracking)
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // 4. Remove elements with display:none or visibility:hidden inline styles
  //    These are responsive design elements, not "hidden phishing messages"
  text = text.replace(/<[^>]+style\s*=\s*["'][^"']*(?:display\s*:\s*none|visibility\s*:\s*hidden)[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');

  // 5. Remove tracking pixels (1x1 images, beacon images)
  text = text.replace(/<img[^>]+(?:width\s*=\s*["']?1["']?|height\s*=\s*["']?1["']?)[^>]*\/?>/gi, '');

  // 6. Remove all remaining <img> tags (just the tag, not for content analysis)
  text = text.replace(/<img[^>]*\/?>/gi, '');

  // 7. Convert <br>, <br/>, <br />, </p>, </div>, </tr>, </li> to newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(?:p|div|tr|li|h[1-6]|blockquote)>/gi, '\n');

  // 8. Convert <td> to tab (preserves table structure readability)
  text = text.replace(/<td[^>]*>/gi, '\t');

  // 9. Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // 10. Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));

  // 11. Clean up whitespace: collapse multiple spaces, trim lines
  text = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');

  // 12. Collapse multiple blank lines into one
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Extract just the plain text content from an email for rule-based analysis.
 * Lighter version that also strips URLs for cleaner keyword matching.
 */
export function extractPlainContent(html) {
  let text = extractVisibleText(html);

  // Remove URLs for cleaner keyword matching
  text = text.replace(/https?:\/\/[^\s]+/g, '');

  return text.trim();
}

/**
 * Count actual external links (not tracking pixels or inline styles) in HTML.
 * More accurate than counting raw href occurrences.
 */
export function countExternalLinks(html) {
  if (!html) return 0;
  // Match <a> tags with href pointing to http/https
  const links = html.match(/<a[^>]+href\s*=\s*["']https?:\/\/[^"']+["'][^>]*>/gi) || [];
  return links.length;
}
