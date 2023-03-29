import {
    PUBLIC_SURREALDB_URL,
    PUBLIC_EMAIL,
    PUBLIC_PASSWORD,
} from "$env/static/public";
import Surreal from 'surrealdb.js';

const db = new Surreal(PUBLIC_SURREALDB_URL);
let answerCount: any = [{ result: [{ count: 12345 }] }];
export async function load({ fetch, params }) {
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
                NS: "allin",
                DB: "talkedof",
                SC: "public24",
                email: PUBLIC_EMAIL,
                pass: PUBLIC_PASSWORD,
            });
            console.log(token)
            await db.use("allin", "talkedof");
            answer = await db.query(
                `SELECT * from transcripts where transcript contains '${searchTerm.toLowerCase()}' limit 10;`
            );

        } catch (error) {
            console.error("ERROR", error);
        } finally {
            console.log(`a: ` + answer[0].result[0].transcript)
            db.close();
            return answer;
        }
    }

    await main('biden');

    return {
        props: {
            post: await main(params.check),
            searchThing: (params.check.toString()),
        }
    };
}