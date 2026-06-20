// mocks/ 配下の各デモサイト（*/index.html）を走査して mocks/manifest.json を生成する。
// GitHub Action から push のたびに自動実行され、ダッシュボードはこのJSONを読むだけ。
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const MOCKS = 'mocks';

function pick(re, html, fb = '') {
  const m = html.match(re);
  return (m ? m[1] : fb).replace(/\s+/g, ' ').trim();
}

const sites = [];
for (const slug of readdirSync(MOCKS)) {
  const dir = join(MOCKS, slug);
  if (!statSync(dir).isDirectory()) continue;
  const index = join(dir, 'index.html');
  if (!existsSync(index)) continue; // index.html を持つフォルダだけ＝1サイト

  const html = readFileSync(index, 'utf8');
  const title = pick(/<title>([\s\S]*?)<\/title>/i, html, slug);
  const name = (title.split(/[｜|]/)[0] || slug).trim();        // 社名＝タイトルの最初の区切りまで
  const description = pick(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i, html);

  // サムネ候補（StellaWebMock基準の相対パス）
  let thumbnail = null;
  for (const c of [`${MOCKS}/${slug}/img/hero.jpg`, `${MOCKS}/${slug}/hp-top.png`, `${MOCKS}/${slug}/hp.png`]) {
    if (existsSync(c)) { thumbnail = c; break; }
  }
  if (!thumbnail && existsSync(`${MOCKS}/koumuten/img/hero.jpg`)) thumbnail = `${MOCKS}/koumuten/img/hero.jpg`;

  sites.push({ slug, name, title, description, path: `${MOCKS}/${slug}/`, thumbnail });
}

sites.sort((a, b) => a.slug.localeCompare(b.slug));
const manifest = { generated: new Date().toISOString(), count: sites.length, sites };
writeFileSync(join(MOCKS, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`manifest: ${sites.length} sites -> ${MOCKS}/manifest.json`);
for (const s of sites) console.log(`  - ${s.slug.padEnd(10)} ${s.name}`);
