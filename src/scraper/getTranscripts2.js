import puppeteer from 'puppeteer'; //node
import Surreal from 'surrealdb.js'; //node
import dotenv from 'dotenv';
dotenv.config();

const channelId = 'everyframeapainting';

// Retrieve the video URLs to transcribe
async function getVideos() {
    try {
        const db = await connectToDatabase();
        const videosToTranscribe = await db.query('SELECT * FROM videos WHERE transcribed = false AND skipped = false limit 2');
        db.close();
        return videosToTranscribe;
    } catch (e) {
        console.error('ERROR', e);
    }
}

// Loop through the videos and get their transcripts
async function processVideos(videosToTranscribe) {
    try {
        for (let video of videosToTranscribe) {
            for (let subVideo of video.result) {
                console.log('Start: ************************************************************************************')
                console.log(subVideo);
                await getTranscript(subVideo);
            }
        }
    } catch (e) {
        console.error('ERROR', e);
    }
}

// Connect to the database
async function connectToDatabase() {
    const db = new Surreal(process.env.PRIVATE_SURREALDB_URL);
    await db.signin({
        // NS: channelId,
        // DB: 'talkedof',
        user: process.env.PRIVATE_USERNAME,
        pass: process.env.PRIVATE_PASSWORD,
    });
    await db.use(channelId, `talkedof`);
    console.log(`Connected to namespace: ${channelId}`);
    return db;
}

// Get the transcript for a video
async function getTranscript(video) {
    try {
        const db = await connectToDatabase();
        const browser = await puppeteer.launch({ headless: true, defaultViewport: null });

        await processPage(video, db, browser);

    } catch (e) {
        console.error('ERROR', e);
        console.log('No transcript found...');
        await updateVideoStatus(video, db, { skipped: true });
        await db.close();
        await browser.close();
    }
}

// Process a single video page
async function processPage(video, db, browser) {
    const url = video.url;
    let count = 0;

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");

    console.log(`Getting transcription for: ${url}`);
    await page.goto(`${url}`);
    await page.waitForSelector('#movie_player > .ytp-chrome-bottom > .ytp-chrome-controls > .ytp-left-controls > .ytp-play-button', { timeout: 5000 });
    await page.click('#movie_player > .ytp-chrome-bottom > .ytp-chrome-controls > .ytp-left-controls > .ytp-play-button');
    await page.waitForSelector('.ytd-watch-metadata > #button-shape > .yt-spec-button-shape-next > yt-touch-feedback-shape > .yt-spec-touch-feedback-shape > .yt-spec-touch-feedback-shape__fill', { timeout: 5000 });
    await page.click('.ytd-watch-metadata > #button-shape > .yt-spec-button-shape-next > yt-touch-feedback-shape > .yt-spec-touch-feedback-shape > .yt-spec-touch-feedback-shape__fill');
    await page.waitForSelector('.ytd-popup-container > #items > .style-scope > .style-scope > .style-scope:nth-child(2)', { timeout: 5000 });
    await page.click('.ytd-popup-container > #items > .style-scope > .style-scope > .style-scope:nth-child(2)');

    page.on('response', async (response) => {
        const request = response.request();
        if (request.url().includes('transcript')) {
            console.log(`Transcript found...`);
            let text = JSON.parse(`${await response.text()}`);
            let transcripts = text.actions[0].updateEngagementPanelAction.content.transcriptRenderer.content.transcriptSearchPanelRenderer.body.transcriptSegmentListRenderer.initialSegments;

            if (typeof transcripts === 'object') {
                await processTranscripts(transcripts, url, db, browser);
                count = transcripts.length;
                console.log(`Saved ${count} lines to namespace: ${channelId}`);
                await updateVideoStatus(video, db, {
                    transcribed: true,
                    lines: count,
                });
            } else {
                console.log(`ERROR: typeof transcript is not object`);

            }
            await db.close();
            await browser.close();
        }
    });
}

// Process the retrieved transcripts and save them to the database
async function processTranscripts(transcripts, url, db, browser) {
    for (let item of transcripts) {
        let start = parseInt(item.transcriptSegmentRenderer.startMs);
        let end = parseInt(item.transcriptSegmentRenderer.endMs);
        let transcript = item.transcriptSegmentRenderer.snippet.runs[0]?.text?.trim()?.replace(/\n\n/g, " ") || ' ';

        await db.create('transcripts', {
            url: url,
            start: start,
            end: end,
            transcript: transcript
        });
    }
}

// Update the video status in the database
async function updateVideoStatus(video, db, updateData) {
    try {
        const updated = await db.change(video.id, updateData);
        // const updated = await db.query(`UPDATE ${video.id} CONTENT ${updateData}`);
        console.log(updated);

    } catch (e) {
        // console.error('ERROR', e);
        //https://github.com/surrealdb/surrealdb.js/issues/74
        console.error('THIS ERROR IS FROM A BUG IN SURREALDB)');
    }

}

// Main function
async function main() {
    const videosToTranscribe = await getVideos();
    await processVideos(videosToTranscribe);
}

main();
