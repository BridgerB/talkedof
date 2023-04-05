// select transcripts[where transcript contains 'film'] from videos where transcribed = true;
import {
    // PUBLIC_SURREALDB_URL,
    // PUBLIC_EMAIL,
    // PUBLIC_PASSWORD,
    PRIVATE_SURREALDB_URL,
    PRIVATE_USERNAME,
    PRIVATE_PASSWORD,
} from "$env/static/private";
import Surreal from 'surrealdb.js';

const db = new Surreal(PRIVATE_SURREALDB_URL);
let answerCount: any = [{ result: [{ count: 12345 }] }];
export async function load({ params, url }) {
    const url2 = new URL(url.origin);
    const hostnameParts = url2.hostname.split(".");
    let subdomain = hostnameParts[0];
    let answer: any[] = [
        {
            result: [
                {
                    transcript: "nope",
                    start: 100000,
                    end: 0,
                    url: "",
                },
            ],
        },
    ];
    let filter: string = "bird";

    async function main(searchTerm: string) {
        console.log(`${subdomain} searched: ${searchTerm}`);
        try {
            await db.connect(PRIVATE_SURREALDB_URL);
            let token = await db.signin({
                // NS: "allin",
                // DB: "talkedof",
                // SC: "public24",
                // email: PUBLIC_EMAIL,
                user: PRIVATE_USERNAME,
                pass: PRIVATE_PASSWORD,
            });
            // Select a specific namespace / database
            await db.use(subdomain, "talkedof");
            answer = await db.query(
                `SELECT * from transcripts where transcript contains '${searchTerm.toLowerCase()}' limit 50;`
            );

        } catch (error) {
            console.error("ERROR", error);
        } finally {
            db.close();
            return answer;
        }
    }

    return {
        props: {
            post: await main(params.check),
            searchThing: (params.check.toString()),
            subdomain: subdomain,
        }
    };
}