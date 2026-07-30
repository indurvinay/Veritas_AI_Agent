import { Router } from 'express';

const router = Router();

// Helper to fetch and parse Google News RSS feed
async function fetchGoogleNews(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const xml = await response.text();

    const items = [];
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

    for (const match of itemMatches) {
      const itemContent = match[1];
      const title = itemContent.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
      const link = itemContent.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
      const pubDate = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
      const source = itemContent.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || '';

      let cleanTitle = title;
      let sourceName = source;

      // Extract source from title if structured as "Title - Source"
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        sourceName = parts.pop();
        cleanTitle = parts.join(' - ');
      }

      // Strip CDATA wrapper if present
      const stripCdata = (str) => str.replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim();

      items.push({
        title: stripCdata(cleanTitle),
        link: link.trim(),
        pubDate: pubDate.trim(),
        source: stripCdata(sourceName || 'Google News')
      });
    }

    return items.slice(0, 15); // Return top 15 news items
  } catch (err) {
    console.error(`Error fetching news for query "${query}":`, err.message);
    return [];
  }
}

// GET /api/news — Fetch news for a category or search term
router.get('/', async (req, res) => {
  try {
    const { category = 'students', q } = req.query;

    let searchQuery = q;
    if (!searchQuery) {
      if (category === 'students') {
        // Students / Job Seekers
        searchQuery = 'hiring OR recruitment OR "job openings" OR internships OR "career opportunities"';
      } else if (category === 'employees') {
        // Employees / Professionals
        searchQuery = '"workplace trends" OR "career development" OR remote-work OR "productivity tips"';
      } else if (category === 'technology') {
        // Tech
        searchQuery = 'technology OR AI OR software OR gadgets';
      } else {
        // Default general news
        searchQuery = 'news';
      }
    }

    const news = await fetchGoogleNews(searchQuery);
    res.json({ success: true, news, count: news.length });
  } catch (err) {
    console.error('News endpoint error:', err.message);
    res.status(500).json({ error: 'Failed to fetch Google News', details: err.message });
  }
});

export default router;
