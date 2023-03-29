import {
    PUBLIC_SURREALDB_URL,
    PUBLIC_EMAIL,
    PUBLIC_PASSWORD,
} from "$env/static/public";
import Surreal from 'surrealdb.js';
let query: any[] = [
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
let answerCount: any = [{ result: [{ count: "calculating..." }] }];
// let filter: string = "bird";
const db = new Surreal(PUBLIC_SURREALDB_URL);
export async function load({ fetch, params }) {
    async function main() {
        try {
            await Surreal.Instance.connect(PUBLIC_SURREALDB_URL);
            let token = await Surreal.Instance.signin({
                NS: "allin",
                DB: "talkedof",
                SC: "public24",
                email: PUBLIC_EMAIL,
                pass: PUBLIC_PASSWORD,
            });
            await Surreal.Instance.use("allin", "talkedof");
            query = await Surreal.Instance.query(
                `SELECT * from transcripts where transcript contains '${params.check.toLowerCase()}' limit 10;`
            );
        } catch (error) {
            console.error("ERROR", error);
        } finally {
            Surreal.Instance.close();
        }
    }
    await main();
    // console.log(query[0].result[0].transcript)
    return {
        query: query,
        check: params.check
    }
}
