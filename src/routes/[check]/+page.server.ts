import {
    PRIVATE_SURREALDB_URL,
    PRIVATE_USERNAME,
    PRIVATE_PASSWORD,
} from "$env/static/private";
import Surreal from 'surrealdb.js';

const db = new Surreal(PRIVATE_SURREALDB_URL);

export async function load({ params, url }) {
    const url2 = new URL(url.origin);
    const hostnameParts = url2.hostname.split(".");
    let subdomain = hostnameParts[0];

    
    async function main(searchTerm: string) {
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
        let answerCount: any = [{ result: [{ count: 12345 }] }];
        let filter: string = "bird";
        console.log(`${subdomain} searched: ${searchTerm}`);
        try {
            await db.connect(PRIVATE_SURREALDB_URL);
            let token = await db.signin({
                user: PRIVATE_USERNAME,
                pass: PRIVATE_PASSWORD,
            });
            // Select a specific namespace / database
            await db.use(subdomain, "talkedof");
            // answer = await db.query(`select * from (select *, transcripts[where transcript contains '${searchTerm.toLowerCase()}'] from videos where transcripts is not NONE order by uploadDate DESC) limit 10 `
            answer = await db.query(`select * from (select *, transcripts[where transcript contains '${searchTerm.toLowerCase()}'] from videos where transcripts is not NONE order by uploadDate DESC)`
            );
            answerCount = await db.query(
                `select uploadDate, count(transcripts[where transcript contains '${searchTerm.toLowerCase()}']) from videos where uploadDate is not None order by uploadDate`
            );

        } catch (error) {
            console.error("ERROR", error);
        } finally {
            db.close();
            return {answer, answerCount};
        }
    }

    const {answer, answerCount} = await main(params.check);

    return {
            post: answer,
            searchThing: params.check.toString(),
            subdomain: subdomain,
            answerCount: answerCount[0],
    };
}
