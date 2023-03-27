<script lang=ts>
    import {
        PUBLIC_SURREALDB_URL,
        PUBLIC_EMAIL,
        PUBLIC_PASSWORD,
    } from "$env/static/public";
    import Surreal from "surrealdb.js";
    let answer: any[] = [
        {
            result: [
                {
                    transcript: "Please hold...",
                    start: 100000,
                    end: 0,
                    url: "",
                },
            ],
        },
    ];
    let answerCount: any = [{ result: [{ count: "calculating..." }] }];
    let filter: string = "Elon";

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
            answer = await Surreal.Instance.query(
                `SELECT * from transcripts where transcript contains '${filter.toLowerCase()}' limit 10;`
            );

            try {
                answerCount = await Surreal.Instance.query(
                    `SELECT count() FROM transcripts WHERE transcript CONTAINS '${filter.toLowerCase()}' GROUP BY ALL;`
                );
            } catch (error) {
                console.error("Error fetching answer count:", error);
                answerCount = 0; // set a default value
            }
        } catch (error) {
            console.error("ERROR", error);
        } finally {
            Surreal.Instance.close();
        }
    }
    main();
</script>

<body>
    <br />
    <h1>allin pod search</h1>
    <br />
    <input
        placeholder="Search for transcripts"
        bind:value={filter}
        id="textInput"
    />
    <!-- <br /> -->
    <button on:click={main}> search </button>
    <br />
    {typeof answerCount[0].result[0].count}

    <p>Total results {JSON.stringify(answerCount[0].result[0].count)}</p>

    {#each answer[0].result as thing}
        <a
            href={thing.url + "&t=" + Math.floor(thing.start / 1000) + "s"}
            target="_blank"
            rel="noreferrer">"{thing.transcript}"</a
        >
        <br />
    {/each}
    <br />
</body>

<style>
    h1 {
        font-size: 50px;
    }
    * {
        font-size: 20px;
    }
    body {
        padding: 1rem 0 0 4rem;
    }
</style>
