import {
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
        try {
            await db.connect(PRIVATE_SURREALDB_URL);
            let token = await db.signin({
                user: PRIVATE_USERNAME,
                pass: PRIVATE_PASSWORD,
            });
            await db.use(subdomain, "talkedof");
            answer = await db.query(
                `select uploadDate, count(transcripts[where transcript contains 'films']) from videos where uploadDate is not None order by uploadDate`
            );

        } catch (error) {
            console.error("ERROR", error);
        } finally {
            console.log(answer[0].result)
            db.close();
            return answer[0];
        }
    }

    return {
            count: await main(params.check),
    };
}
