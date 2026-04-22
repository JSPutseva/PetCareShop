import { parse } from 'csv-parse/sync';
import { readFileSync, writeFileSync } from 'fs';

const raw = readFileSync('./src/data/chewy_scraper_sample.csv', 'utf8');

const rows = parse(raw, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
});

function detectAnimal(breadcrumb = '') {
  const b = breadcrumb.toLowerCase();
  if (b.startsWith('cat')) return 'cats';
  if (b.startsWith('dog')) return 'dogs';
  return null;
}

function detectCategory(breadcrumb = '') {
  const second = breadcrumb.toLowerCase().split('>')[1]?.trim().replace(/^"/, '') ?? '';
  if (second.includes('food') || second.includes('treat') || second.includes('feed')) return 'food';
  if (second.includes('toy') || second.includes('tree') || second.includes('scratch') || second.includes('condo')) return 'toys';
  if (second.includes('health') || second.includes('vitamin') || second.includes('supplement') || second.includes('flea') || second.includes('tick')) return 'health';
  if (second.includes('groom') || second.includes('clean') || second.includes('potty') || second.includes('litter')) return 'hygiene';
  return 'accessories';
}

function detectSubcategory(breadcrumb = '') {
  const parts = breadcrumb.toLowerCase().split('>').map(p => p.trim().replace(/^"/, ''));
  const second = parts[1] ?? '';
  const third  = parts[2] ?? '';

  if (second.includes('treat'))                                          return 'treats';
  if (second.includes('food') || second.includes('feed')) {
    if (third.includes('wet'))                                           return 'wet food';
    if (third.includes('freeze') || third.includes('premium'))          return 'premium food';
    return 'dry food';
  }
  if (second.includes('toy')) {
    if (third.includes('plush'))                                         return 'plush toys';
    if (third.includes('interactive') || third.includes('treat toy'))   return 'interactive toys';
    if (third.includes('fetch'))                                         return 'fetch toys';
    if (third.includes('rope') || third.includes('tug'))                return 'rope toys';
    return 'toys';
  }
  if (second.includes('tree') || second.includes('scratch') || second.includes('condo')) return 'furniture';
  if (second.includes('leash') || second.includes('collar') || second.includes('harness')) return 'leashes';
  if (second.includes('bed'))                                            return 'beds';
  if (second.includes('groom'))                                          return 'grooming';
  if (second.includes('clean') || second.includes('potty'))             return 'cleaning';
  if (second.includes('litter'))                                         return 'litter';
  if (second.includes('vitamin') || second.includes('supplement'))      return 'vitamins';
  if (second.includes('flea') || second.includes('tick'))               return 'flea & tick';
  if (second.includes('health') || second.includes('dental'))           return 'healthcare';
  if (second.includes('carrier') || second.includes('travel') || second.includes('crate') || second.includes('pen')) return 'carriers';
  if (second.includes('clothing'))                                       return 'clothing';
  if (second.includes('bowl') || second.includes('feeder'))             return 'bowls';
  return 'other';
}

function parseImage(images = '') {
  const match = images.match(/https?:\/\/[^'"]+/);
  return match ? match[0] : null;
}

function parsePrice(price = '') {
  const n = parseFloat(price.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

const products = rows
  .map((r, i) => {
    const animal = detectAnimal(r.breadcrumb);
    if (!animal) return null;

    return {
      id:           r.uniq_id || String(i),
      name:         r.name?.trim() ?? '',
      description:  r.description?.trim() ?? '',
      price:        parsePrice(r.Price),
      animal,
      category:     detectCategory(r.breadcrumb),
      subcategory:  detectSubcategory(r.breadcrumb),
      brand:        r.brand?.trim() || null,
      image:        parseImage(r.images),
      rating:       parseFloat(r.average_rating) || null,
      reviewCount:  parseInt(r.reviews_count)    || 0,
      availability: r.availability === 'InStock' ? 'in-stock' : 'out-of-stock',
      barcode:      r.gtin12?.trim()             || null,
      ingredients:  r.ingredients?.trim()        || null,
    };
  })
  .filter(Boolean);

writeFileSync('./src/data/products.json', JSON.stringify(products, null, 2));

const cats = products.filter(p => p.animal === 'cats').length;
const dogs = products.filter(p => p.animal === 'dogs').length;
console.log(`Done — ${products.length} products (${cats} cats, ${dogs} dogs)`);
