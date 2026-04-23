// SSR SEO Test Script

const BASE_URL = 'http://localhost:5000';

const routesToTest = [
  { name: 'Home', path: '/' },
  { name: 'Ads Listing', path: '/ads' },
  { name: 'Ad Detail', path: '/ads/call-girls-in-murree-03078488875-murree-call-girls' }, 
  { name: 'City Page', path: '/cities/lahore-call-girls-services' },
  { name: 'Category Page', path: '/escorts' }
];

async function testRoute(name, path) {
  console.log(`Testing [${name}] at ${path}...`);
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' }
    });
    const html = await response.text();

    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : 'NOT FOUND';

    const initialDataMatch = html.includes('window.__INITIAL_DATA__');
    const contentInjected = html.includes('id="root">') && !html.includes('id="root">{{CONTENT}}</div>');
    
    // Check for some keywords in content to be sure it's not empty
    const hasRealContent = html.includes('<h1>') || html.includes('<ul>') || html.includes('<article>');

    console.log(`  - Status: ${response.status}`);
    console.log(`  - Title: ${title}`);
    console.log(`  - Initial Data Script: ${initialDataMatch ? '✅ Found' : '❌ Missing'}`);
    console.log(`  - Content Injected: ${contentInjected ? '✅ Yes' : '❌ No (Placeholder detected)'}`);
    console.log(`  - Real Content Detected: ${hasRealContent ? '✅ Yes' : '❌ No'}`);
    
    if (title === '{{SEO_TITLE}}') {
        console.log(`  - ❌ ERROR: SEO_TITLE placeholder was not replaced!`);
    }
    console.log('');
  } catch (err) {
    console.error(`  - ❌ FAILED to fetch ${path}:`, err.message);
  }
}

async function runTests() {
  console.log('--- STARTING SEO & CONTENT SSR TESTS ---\n');
  
  // Note: We are using global fetch. If you are on Node < 18, you need node-fetch.
  if (typeof fetch === 'undefined') {
    console.error('Error: fetch is not defined. Please use Node.js 18+ or install node-fetch.');
    return;
  }

  for (const route of routesToTest) {
    await testRoute(route.name, route.path);
  }

  console.log('--- TESTS COMPLETED ---');
}

runTests();
