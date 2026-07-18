/*  generate-sitemap.mjs — Team Foundation.immo
 *  Régénère sitemap.xml + robots.txt en scannant les fichiers .html du dossier.
 *  - Les pages contenant <meta name="robots" content="noindex"> sont exclues
 *    du sitemap et bloquées dans robots.txt.
 *  - lastmod = date de dernière modification du fichier.
 *  Lancement :  node generate-sitemap.mjs
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';

// >>> Ta version canonique du domaine (avec ou sans www) <<<
const BASE_URL = 'https://www.foundation.immo';

// Priorités par page (défaut 0.8)
const PRIORITY = { 'index.html': '1.0', 'mandats.html': '0.9' };
const CHANGEFREQ = 'weekly';

const htmlFiles = readdirSync('.').filter(f => f.endsWith('.html'));
const indexed = [];
const noindex = [];

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const isNoindex = /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html);
  const lastmod = statSync(file).mtime.toISOString().slice(0, 10);
  const path = file === 'index.html' ? '/' : '/' + file;
  if (isNoindex) noindex.push(path);
  else indexed.push({ path, lastmod, priority: PRIORITY[file] || '0.8' });
}

// Accueil en premier, puis priorité décroissante
indexed.sort((a, b) =>
  a.path === '/' ? -1 : b.path === '/' ? 1 : Number(b.priority) - Number(a.priority));

const urls = indexed.map(u => `  <url>
    <loc>${BASE_URL}${u.path}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${CHANGEFREQ}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);

writeFileSync('robots.txt', `User-agent: *
Allow: /
${noindex.map(p => 'Disallow: ' + p).join('\n')}

Sitemap: ${BASE_URL}/sitemap.xml
`);

console.log(`✓ sitemap.xml : ${indexed.length} page(s) indexée(s) — ${indexed.map(u=>u.path).join(', ')}`);
console.log(`✓ robots.txt  : ${noindex.length} exclue(s) — ${noindex.join(', ') || 'aucune'}`);
