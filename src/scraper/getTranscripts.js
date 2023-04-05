// import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts"; //deno
// import Surreal from "https://deno.land/x/surrealdb/mod.ts"; //deno
import puppeteer from 'puppeteer'; //node
import Surreal from 'surrealdb.js'; //node
import dotenv from 'dotenv';
dotenv.config();
//********************************************************************
const channel_id = 'everyframeapainting';
//********************************************************************
async function get_videos() {
    try {
        const db = new Surreal(process.env.PRIVATE_SURREALDB_URL);
        let tokin = await db.signin({
            // DB: 'talkedof',
            // SC: channel_id,
            user: process.env.PRIVATE_USERNAME,
            pass: process.env.PRIVATE_PASSWORD,

        });
        await db.wait();
        await db.use(`${channel_id}`, `talkedof`);
        console.log(`${tokin}`);
        console.log(`Connected to namespace: ${channel_id}`);
        let videos_to_transcribe = await db.query('SELECT * FROM videos WHERE transcribed = false AND skipped = false limit 2');
        await db.close();
        return await videos_to_transcribe

    } catch (e) {
        console.error('ERROR', e);
    }
};
async function video_loop(videos_to_transcribe) {
    try {

        for (let video of videos_to_transcribe) {
            for (let sub_thing of video.result) {
                console.log('Start: ************************************************************************************')
                
                console.log(sub_thing)
                await get_transcript(sub_thing)
            }
        }
    } catch (e) {
        console.error('ERROR', e);
    }
};
async function get_transcript(video) {
    const db = new Surreal(process.env.PRIVATE_SURREALDB_URL);
    await db.signin({
        user: process.env.PRIVATE_USERNAME,
        pass: process.env.PRIVATE_PASSWORD,
    });
    await db.use(channel_id, `talkedof`);
    console.log(`Connected to namespace: ${channel_id}`);
    const browser = await puppeteer.launch({ headless: true, defaultViewport: null })

    try {
        let url = video.url
        let count = 0;
        let data = []
        let transcript = '';
        const page = await browser.newPage()
        await page.setViewport({ width: 1920, height: 1080 })
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36");
        console.log(`Getting transcription for: ${url}`);
        await page.goto(url)
        // await page.setDefaultNavigationTimeout(5000);
        await page.waitForSelector('#movie_player > .ytp-chrome-bottom > .ytp-chrome-controls > .ytp-left-controls > .ytp-play-button', { timeout: 5000 })
        await page.click('#movie_player > .ytp-chrome-bottom > .ytp-chrome-controls > .ytp-left-controls > .ytp-play-button')
        await page.waitForSelector('.ytd-watch-metadata > #button-shape > .yt-spec-button-shape-next > yt-touch-feedback-shape > .yt-spec-touch-feedback-shape > .yt-spec-touch-feedback-shape__fill', { timeout: 5000 })
        await page.click('.ytd-watch-metadata > #button-shape > .yt-spec-button-shape-next > yt-touch-feedback-shape > .yt-spec-touch-feedback-shape > .yt-spec-touch-feedback-shape__fill')
        await page.waitForSelector('.ytd-popup-container > #items > .style-scope > .style-scope > .style-scope:nth-child(2)', { timeout: 5000 })
        await page.click('.ytd-popup-container > #items > .style-scope > .style-scope > .style-scope:nth-child(2)')
        page.on('response', async (response) => {
            const request = response.request();
            if (request.url().includes('transcript')) {
                console.log(`Transcript found...`);
                let text = JSON.parse(`${await response.text()}`)
                let transcripts = text.actions[0].updateEngagementPanelAction.content.transcriptRenderer.content.transcriptSearchPanelRenderer.body.transcriptSegmentListRenderer.initialSegments
                // console.log(typeof transcripts)
                if (typeof transcripts == 'object') {
                    for (let item of transcripts) {
                        let start = parseInt(item.transcriptSegmentRenderer.startMs);
                        let end = parseInt(item.transcriptSegmentRenderer.endMs);
                        if (typeof (item.transcriptSegmentRenderer.snippet.runs) === 'undefined') {
                            console.log('Flag')
                            transcript = ' '
                        } else {
                            transcript = item.transcriptSegmentRenderer.snippet.runs[0].text.trim().replace(/\n\n/g, " ");
                        }
                        let created = await db.create('transcripts', {
                            url: url,
                            start: start,
                            end: end,
                            transcript: transcript
                        });
                        console.log(created)
                        count += 1;
                    }
                    console.log(`Saved ${count} lines to namespace: ${channel_id}`);
                    try {
                        let test = await db.query('SELECT * FROM videos limit 2');
                        console.log(JSON.stringify(test))
                        console.log(JSON.stringify(video))

                        let updated = await db.change(video.id, {
                            transcribed: true,
                            lines: count,
                        })

                        console.log(updated)
                    } catch (e) {
                        // console.error('change error: ', e);
                        console.error('change error...');
                    }

                    browser.close()
                    db.close();
                } else {
                    console.log(`ERROR typeof transcript is not object`)
                    browser.close()
                    db.close();
                }
            }

        })
    } catch (e) {
        console.error('ERROR', e);
        console.log('No transcript found...');
        let updated = await db.change(video.id, {
            skipped: true
        })
        console.log(updated)
        db.close();
        await browser.close()
    }
}
async function main() {
    let videos_to_transcribe = await get_videos();
    await video_loop(videos_to_transcribe)
}
main();