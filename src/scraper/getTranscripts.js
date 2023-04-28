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
/**
 * Connect to the database.
 * @returns {Promise<Surreal>} A connected Surreal instance.
 */
async function connectToDatabase() {
    const db = new Surreal(process.env.PRIVATE_SURREALDB_URL);
    await db.signin({
        user: process.env.PRIVATE_USERNAME,
        pass: process.env.PRIVATE_PASSWORD,
    });
    await db.use(ns, 'talkedof');
    console.log(`Connected to namespace: ${ns}`);
    return db;
}

/**
 * Retrieve the video URLs to transcribe.
 * @param {Surreal} db - Connected Surreal instance.
 * @returns {Promise<Array>} List of videos to transcribe.
 */
async function getVideos(db) {
    const videosToTranscribe = await db.query(
        'SELECT * FROM videos WHERE transcribed = false AND skipped = false limit 13'
    );
    return videosToTranscribe;
}

/**
 * Loop through the videos and get their transcripts.
 * @param {Array} videosToTranscribe - List of videos to transcribe.
 * @param {Surreal} db - Connected Surreal instance.
 */
async function processVideos(videosToTranscribe, db) {
    const promises = videosToTranscribe.map(async (video) => {
        for (const subVideo of video.result) {
            console.log(
                'Start: ************************************************************************************'
            );
            console.log(subVideo);
            await getTranscript(subVideo, db);
        }
    });
    await Promise.all(promises);
}

// Get the transcript for a video
async function getTranscript(video, db) {
    try {
        const db = await connectToDatabase();
        const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
        await processPage(video, db, browser);
    } catch (e) {
        console.error('ERROR', e);
        console.log('No transcript found...');
    }
    await db.close();
}

// Process a single video page
async function processPage(video, db, browser) {
    const url = video.url;
    let count = 0;
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");
    console.log(`Getting transcription for: ${video.videoId}`);
    await page.goto(`https://www.youtube.com/watch?v=${video.videoId}}`);
    await page.waitForSelector('#info > span:nth-child(3)', { timeout: 5000 });
    await page.click('#info > span:nth-child(3)');
    await page.waitForSelector('#movie_player > .ytp-chrome-bottom > .ytp-chrome-controls > .ytp-left-controls > .ytp-play-button', { timeout: 5000 });
    await page.click('#movie_player > .ytp-chrome-bottom > .ytp-chrome-controls > .ytp-left-controls > .ytp-play-button');
    await page.waitForSelector('.ytd-watch-metadata > #button-shape > .yt-spec-button-shape-next > yt-touch-feedback-shape > .yt-spec-touch-feedback-shape > .yt-spec-touch-feedback-shape__fill', { timeout: 5000 });
    await page.click('.ytd-watch-metadata > #button-shape > .yt-spec-button-shape-next > yt-touch-feedback-shape > .yt-spec-touch-feedback-shape > .yt-spec-touch-feedback-shape__fill');
    await page.waitForSelector('.ytd-popup-container > #items > .style-scope > .style-scope > .style-scope:nth-child(2)', { timeout: 5000 });
    await page.click('.ytd-popup-container > #items > .style-scope > .style-scope > .style-scope:nth-child(2)');
    const videoDetails = await page.evaluate(() => {
        const jsonString = document.querySelector("#scriptTag").innerText;
        const jsonObj = JSON.parse(jsonString);
        return jsonObj;
    });
    const channel = await page.evaluate(() => {
        const channelURL = document.querySelector("#text-container.ytd-channel-name a.yt-simple-endpoint").href;
        const match = channelURL.match(/@(.*)/);
        const result = match[1];
        console.log(result);
        return result;
    });
    page.on('response', async (response) => {
        const request = response.request();
        if (request.url().includes('transcript')) {
            console.log(`Transcript found...`);
            let text = JSON.parse(`${await response.text()}`);
            let transcripts = text.actions[0].updateEngagementPanelAction.content.transcriptRenderer.content.transcriptSearchPanelRenderer.body.transcriptSegmentListRenderer.initialSegments;
            if (typeof transcripts === 'object') {
                await processTranscripts(transcripts, url, db, browser, video);
                count = transcripts.length;
                console.log(`Saved ${count} lines to namespace: ${ns}`);
                await updateVideoStatus(video, db, {
                    transcribed: true,
                    lines: count,
                    uploadDate: new Date(videoDetails.uploadDate),
                    thumbnailUrl: videoDetails.thumbnailUrl[0],
                    channel: channel,
                });
            } else {
                console.log(`ERROR: typeof transcript is not object`);
                console.log(transcripts)
                await updateVideoStatus(video, db, { skipped: true });
            }
            await db.close();
            await browser.close();
        }
    });
}

// Process the retrieved transcripts and save them to the database
async function processTranscripts(transcripts, url, db, browser, video) {
    // console.log(transcripts)
    transcripts.forEach((item, transcriptIndex) => {
        const segment = item.transcriptSegmentRenderer;
        let start = parseInt(segment.startMs);
        let end = parseInt(segment.endMs);
        let transcript = segment.snippet.runs[0]?.text
            ?.trim()
            ?.replace(/(\n\n|\n)/g, " ") // Replace single or double newline characters with a space
            //?.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]'"’?!:;<>\|+-.]/g, "")
            ?.replace(/[^a-zA-Z\s]/g, "")

            ?.replace(/\s+/g, " ") // Replace multiple spaces with a single space
            ?.toLowerCase() // Convert to lowercase
            ?.trim()
            || ' ';
        item.startMs = start;
        item.endMs = end;
        item.transcript = transcript;
        item.transcriptIndex = transcriptIndex;
        delete item.transcriptSegmentRenderer;
        delete segment.startTimeText;
        delete segment.trackingParams;
        delete segment.accessibility;
        delete segment.targetId;
        delete segment.snippet;
    });
    // console.log(transcripts)



    try {
        await db.change(video.id, {
            transcripts: transcripts
        });
    } catch (e) {
        //https://github.com/surrealdb/surrealdb.js/issues/74
        console.error('THIS ERROR IS FROM A BUG IN SURREALDB)');
    }

}

// Update the video status in the database
async function updateVideoStatus(video, db, updateData) {
    try {
        await db.change(video.id, updateData);
    } catch (e) {
        //https://github.com/surrealdb/surrealdb.js/issues/74
        console.error('THIS ERROR IS FROM A BUG IN SURREALDB)');
    }
}

// Main function
async function main() {
    const db = await connectToDatabase();
    const videosToTranscribe = await getVideos(db);
    await processVideos(videosToTranscribe, db);
}
main();
