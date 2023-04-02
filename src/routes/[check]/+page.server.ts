import {
    PUBLIC_SURREALDB_URL,
    PUBLIC_EMAIL,
    PUBLIC_PASSWORD,
    PUBLIC_USERNAME,
    PUBLIC_PASSWORD2,
} from "$env/static/public";
import Surreal from 'surrealdb.js';

const db = new Surreal(PUBLIC_SURREALDB_URL);
let answerCount: any = [{ result: [{ count: 12345 }] }];
export async function load({ params, url }) {
    const url2 = new URL(url.origin);
    const hostnameParts = url2.hostname.split(".");
    const subdomain = hostnameParts[0];
    console.log(subdomain);
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
        try {
            await db.connect(PUBLIC_SURREALDB_URL);
            let token = await db.signin({
                // NS: "allin",
                // DB: "talkedof",
                // SC: "public24",
                // email: PUBLIC_EMAIL,
                user: PUBLIC_USERNAME,
                pass: PUBLIC_PASSWORD2,
            });
            // Select a specific namespace / database
            await db.use(subdomain, "talkedof");
            answer = await db.query(
                `SELECT * from transcripts where transcript contains '${searchTerm.toLowerCase()}' limit 10;`
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
        }
    };
}