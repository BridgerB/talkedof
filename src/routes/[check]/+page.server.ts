// import {
//     PUBLIC_SURREALDB_URL,
//     PUBLIC_EMAIL,
//     PUBLIC_PASSWORD,
// } from "$env/static/public";
// import Surreal from 'surrealdb.js';
// let query: any[] = [
//     {
//         result: [
//             {
//                 transcript: "nope",
//                 start: 100000,
//                 end: 0,
//                 url: "",
//             },
//         ],
//     },
// ];
// let answerCount: any = [{ result: [{ count: "calculating..." }] }];



// let filter: string = "bird";
// const db = new Surreal(PUBLIC_SURREALDB_URL);
// export async function load({ fetch, params }) {
//     async function main() {
//         try {
//             await db.connect(PUBLIC_SURREALDB_URL);
//             let token = await db.signin({
//                 NS: "allin",
//                 DB: "talkedof",
//                 SC: "public24",
//                 email: PUBLIC_EMAIL,
//                 pass: PUBLIC_PASSWORD,
//             });
//             await db.use("allin", "talkedof");
//             query = await db.query(
//                 `SELECT * from transcripts where transcript contains '${params.check.toLowerCase()}' limit 10;`
//             );
//         } catch (error) {
//             console.error("ERROR", error);
//         } finally {
//             db.close();
//         }
//     }
//     await main();
//     // console.log(query[0].result[0].transcript)
//     return {
//         query: query,
//         check: params.check
//     }
// }
/////////////////////////////////////////////////////////////////////////
import {
    PUBLIC_SURREALDB_URL,
    PUBLIC_EMAIL,
    PUBLIC_PASSWORD,
} from "$env/static/public";
import Surreal from 'surrealdb.js';

const db = new Surreal(PUBLIC_SURREALDB_URL);
export async function load({ fetch, params }) {
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
            // console.log(params.check.toLowerCase())
            query = await db.query(
                `SELECT * from transcripts where transcript contains '${searchTerm.toLowerCase()}' limit 10;`
            );
            
        } catch (error) {
            console.error("ERROR", error);
        } finally {
            console.log(`a: `+query[0].result[0].transcript)
            db.close();
            return query;

        }
    }
    
    await main('biden');
    
    return {
        props: {
            // query: query,
            post: await main(params.check),
            searchThing: (params.check.toString())
            // check: params.check
        }
    };
}
