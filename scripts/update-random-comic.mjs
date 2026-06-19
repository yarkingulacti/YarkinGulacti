import { readFile, writeFile } from 'node:fs/promises';

const readmePath = new URL('../README.md', import.meta.url);
const startMarker = '<!-- RANDOM-COMIC:START -->';
const endMarker = '<!-- RANDOM-COMIC:END -->';
const latestUrl = 'https://xkcd.com/info.0.json';
const skipComics = new Set([
  404,
  1350,
  1608,
  1663,
  2198,
]);

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'YarkinGulacti-profile-readme-comic-bot' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function randomComicNumber(latestNumber) {
  let number = 1 + Math.floor(Math.random() * latestNumber);

  while (skipComics.has(number)) {
    number = 1 + Math.floor(Math.random() * latestNumber);
  }

  return number;
}

function markdownImageAlt(text) {
  return String(text).replace(/[\[\]\n]/g, ' ').trim();
}

function buildComicBlock(comic) {
  const title = comic.safe_title || comic.title || `xkcd #${comic.num}`;
  const alt = comic.alt ? `> ${String(comic.alt).replace(/\n/g, ' ')}` : '> The tooltip escaped. Very on-brand.';

  return [
    '## 🎲 Random comic break, because brains need snacks',
    '',
    `<a href="https://xkcd.com/${comic.num}/">`,
    `  <img src="${comic.img}" alt="${markdownImageAlt(title)}" height="260" />`,
    '</a>',
    '',
    `**xkcd #${comic.num}: ${title}**`,
    '',
    alt,
    '',
    '<sub>Auto-shuffled by GitHub Actions. If this comic explains production, please open an incident.</sub>',
  ].join('\n');
}

async function main() {
  const latest = await fetchJson(latestUrl);
  const comicNumber = randomComicNumber(latest.num);
  const comic = await fetchJson(`https://xkcd.com/${comicNumber}/info.0.json`);
  const nextBlock = buildComicBlock(comic);
  const readme = await readFile(readmePath, 'utf8');
  const start = readme.indexOf(startMarker);
  const end = readme.indexOf(endMarker);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`README.md must contain ${startMarker} and ${endMarker}`);
  }

  const before = readme.slice(0, start + startMarker.length);
  const after = readme.slice(end);
  await writeFile(readmePath, `${before}\n${nextBlock}\n${after}`, 'utf8');
}

await main();
