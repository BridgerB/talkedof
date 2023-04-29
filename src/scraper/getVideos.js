// import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts"; //deno
// import Surreal from "https://deno.land/x/surrealdb/mod.ts"; //deno
import puppeteer from 'puppeteer'; //node
import Surreal from 'surrealdb.js'; //node
import dotenv from 'dotenv';
dotenv.config();
//********************************************************************
const channel_name = 'allin';
const ns = 'allin'
//********************************************************************
const url = `https://www.youtube.com/@${channel_name}/videos`;

const db = new Surreal(process.env.PRIVATE_SURREALDB_URL);

const SURREAL_CREDENTIALS = {
  user: process.env.PRIVATE_USERNAME,
  pass: process.env.PRIVATE_PASSWORD,
};

async function signInAndUseNamespace() {
  await db.signin(SURREAL_CREDENTIALS);
  await db.use(ns, `talkedof`);
  console.log(`Connected to namespace: ${ns}`);
}

async function setupBrowser() {
  const browser = await puppeteer.launch({ headless: true, dumpio: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");

  return { browser, page };
}

async function scrollToBottom(page) {
  const endTime = Date.now() + 30000;

  while (Date.now() < endTime) {
    await page.evaluate(() => {
      window.scrollBy(0, 10000);
    });
    await page.waitForTimeout(100); // Wait for 100 milliseconds before scrolling again
  }
}



async function scrapeVideoData(page) {
  await page.goto(url, { waitUntil: 'networkidle2' });
  await scrollToBottom(page);
  
  
  return page.$$eval('a', as => as.map(a => {

    
    return {
      url: a.href,
      title: a.title,
    };
  }));
}

async function storeVideos(videos) {
  let count = 0;
  await db.query(`DEFINE INDEX url ON TABLE videos COLUMNS videoId UNIQUE;`);
  for (const video of videos) {
    if (video.url.includes('watch') && video.title !== '') {
      count += 1;
      try {
        const regex = /(?:\?v=)(.*)/;
        const match = video.url.match(regex);
        const videoId = match ? match[1] : null;
        // console.log(videoId)

        // console.log(video.videoId)
        const record = await db.create('videos', {
          title: video.title,
          videoId: videoId,
          
          // ...video,
          transcribed: false,
          skipped: false,
          lines: 0,
          uploadDate: new Date(),
          thumbnailUrl: 'noneYet',
          channel: channel_name
        });
        console.log(record);
        // console.log(video.url, video.title);
      } catch (e) {
        count -= 1;
        console.error(`Error: Video already exists. ${video.title}`);
      }

    }
  }

  console.log(`Added ${count} videos.`);
}

async function main() {
  try {
    await signInAndUseNamespace();
    const { browser, page } = await setupBrowser();
    const videos = await scrapeVideoData(page);
    await storeVideos(videos);
    await browser.close();
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    db.close();
  }
}

main();
