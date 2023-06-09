// import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts"; //deno
// import Surreal from "https://deno.land/x/surrealdb/mod.ts"; //deno
import puppeteer from 'puppeteer'; //node
import Surreal from 'surrealdb.js'; //node
import dotenv from 'dotenv';
dotenv.config();
//********************************************************************
const ns = 'ramdass'
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
    try {
        const videosToTranscribe = await db.query(
            'SELECT * FROM videos WHERE transcribed = false AND skipped = false limit 50'
        );
        return videosToTranscribe;
    } catch (error) {
        console.error('Error getting videos:', error);
        return [];
    }
}

/**
 * Loop through the videos and get their transcripts.
 * @param {Array} videosToTranscribe - List of videos to transcribe.
 * @param {Surreal} db - Connected Surreal instance.
 */
async function processVideos(videosToTranscribe, db) {
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null });
    try {
        for (const video of videosToTranscribe) {
            for (const subVideo of video.result) {
                console.log(
                    'Start: ************************************************************************************'
                );
                await getTranscript(subVideo, db, browser);
            }
        }
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed');
        }
    }
}

/**
 * @typedef {Object} ResolveFunction
 * @property {function():void} resolve
 */

/**
 * Get the transcript for a video
 * @param {Object} video
 * @param {Surreal} db
 * @param {puppeteer.Browser} browser
 * @returns {Promise<void>}
 */
// Get the transcript for a video
async function getTranscript(video, db, browser) {
    return new Promise(async (resolve, reject) => {
        try {
            const timeout = setTimeout(() => {
                console.log('No transcript found within the time limit...');
                resolve();
            }, 30000); // 30 seconds timeout

            await processVideoPage(video, db, browser);
            clearTimeout(timeout); // Clear the timeout when a transcript is found
            resolve();
        } catch (e) {
            console.error('ERROR', e);
            console.log('No transcript found...');
            resolve();
        }
    });
}



// Opens a new browser page and configures it
async function openConfiguredPage(browser) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");
    return page;
}

// Navigates to the video URL and handles interactions
const DEFAULT_TIMEOUT = 5000;
async function navigateToVideoAndHandleInteractions(page, videoId) {
    await page.goto(`https://www.youtube.com/watch?v=${videoId}`);
    try {
        await page.waitForSelector('#info > span:nth-child(3)', { timeout: DEFAULT_TIMEOUT });
        await page.click('#info > span:nth-child(3)');
        await page.waitForSelector('#movie_player > .ytp-chrome-bottom > .ytp-chrome-controls > .ytp-left-controls > .ytp-play-button', { timeout: DEFAULT_TIMEOUT });
        await page.click('#movie_player > .ytp-chrome-bottom > .ytp-chrome-controls > .ytp-left-controls > .ytp-play-button');
        await page.waitForSelector('.ytd-watch-metadata > #button-shape > .yt-spec-button-shape-next > yt-touch-feedback-shape > .yt-spec-touch-feedback-shape > .yt-spec-touch-feedback-shape__fill', { timeout: DEFAULT_TIMEOUT });
        await page.click('.ytd-watch-metadata > #button-shape > .yt-spec-button-shape-next > yt-touch-feedback-shape > .yt-spec-touch-feedback-shape > .yt-spec-touch-feedback-shape__fill');
        await page.waitForSelector('.ytd-popup-container > #items > .style-scope > .style-scope > .style-scope:nth-child(2)', { timeout: DEFAULT_TIMEOUT });
        await page.click('.ytd-popup-container > #items > .style-scope > .style-scope > .style-scope:nth-child(2)');
    } catch (e) {
        throw new Error(`Error: can't find transcript... ${e.message}`);
    }
}

// Extracts and processes the transcript data
async function extractAndProcessTranscriptData(page, video, url, db) {
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

    const response = await page.waitForResponse(
        (response) => response.request().url().includes('transcript'),
        { timeout: 10000 }
    );

    console.log(`Transcript found...`);
    let text = JSON.parse(`${await response.text()}`);
    let transcripts = text.actions[0].updateEngagementPanelAction.content.transcriptRenderer.content.transcriptSearchPanelRenderer.body.transcriptSegmentListRenderer.initialSegments;

    if (typeof transcripts === 'object') {
        await processTranscripts(transcripts, url, db, video);
        const count = transcripts.length;
        return {
            count: count,
            uploadDate: new Date(videoDetails.uploadDate),
            thumbnailUrl: videoDetails.thumbnailUrl[0],
            channel: channel,
        };
    } else {
        throw new Error("ERROR: typeof transcript is not object");
    }
}

// Processes a single video page
async function processVideoPage(video, db, browser) {
    return new Promise(async (resolve, reject) => {
        const url = video.url;
        const page = await openConfiguredPage(browser);
        console.log(`Getting transcription for: ${video.videoId}`);

        try {
            await navigateToVideoAndHandleInteractions(page, video.videoId);
            const result = await extractAndProcessTranscriptData(page, video, url, db);
            await updateVideoStatus(video, db, {
                transcribed: true,
                lines: result.count,
                uploadDate: result.uploadDate,
                thumbnailUrl: result.thumbnailUrl,
                channel: result.channel,
            });
            console.log('Video transcribed and updated.');
        } catch (e) {
            console.error(e.message);
            await updateVideoStatus(video, db, { skipped: true });
            console.log('Video skipped and updated.');
        }

        await page.close();
        resolve();
    });
}





// Process the retrieved transcripts and save them to the database
async function processTranscripts(transcripts, url, db, video) {
    const filteredTranscripts = transcripts.filter(item => !item.hasOwnProperty('transcriptSectionHeaderRenderer'));

    const cleanedTranscripts = filteredTranscripts.map((item, index) => {
        const segment = item.transcriptSegmentRenderer;
        let start = parseInt(segment.startMs);
        let end = parseInt(segment.endMs);
        let transcript = segment.snippet.runs[0].text
            ?.trim()
            ?.replace(/(\n\n|\n)/g, " ")
            ?.replace(/[^a-zA-Z\s]/g, "")
            ?.replace(/\s+/g, " ")
            ?.toLowerCase()
            ?.trim()
            || ' ';

        return {
            startMs: start,
            endMs: end,
            transcript: transcript,
            transcriptIndex: index
        };
    });

    try {
        console.log(`Updating video transcripts for ${video.videoId}`);

        await db.change(video.id, {
            transcripts: cleanedTranscripts
        });

        console.log(`Transcription added`);
    } catch (e) {
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

async function main() {
    let db = null;
    try {
        db = await connectToDatabase();
        const videosToTranscribe = await getVideos(db);
        await processVideos(videosToTranscribe, db);
    } catch (error) {
        console.error('Error in main:', error);
    } finally {
        if (db) {
            console.log('Closing database connection...')
            db.close();
            console.log('Database connection closed.')
        }
    }
}
main();

