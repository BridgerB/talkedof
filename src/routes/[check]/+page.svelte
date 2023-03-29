<script lang=ts>
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { invalidate, invalidateAll } from '$app/navigation';

    export let data;
    // let query = data.query;
    // console.log(`b: `+JSON.stringify(query))
    // console.log(data.query)
    // console.log(data.check)
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
    export let filter: string = data.searchThing;
    // export let filter2: string = `/${filter}`;

    async function main() {
//         let url2 = `/${filter}`;
//         try {
//             await invalidateAll()
//             await goto(url2, {invalidateAll: true});
            
//         } catch (error) {
//     console.error('Failed to navigate:', error);
//   }

    }


    // main();
</script>

<section class="hero">
    <h1>allin pod search</h1>
    <input
        placeholder="Search for transcripts"
        bind:value={filter}
        id="searchInput"
    />
    <button on:click={main}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
            ><path
                d="M384 208A176 176 0 1 0 32 208a176 176 0 1 0 352 0zM343.3 366C307 397.2 259.7 416 208 416C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208c0 51.7-18.8 99-50 135.3L507.3 484.7c6.2 6.2 6.2 16.4 0 22.6s-16.4 6.2-22.6 0L343.3 366z"
            /></svg
        >
    </button>
    <a href={filter}> words </a>
</section>
<!-- {typeof answerCount[0].result[0].count} -->

<section class="searchStatus">
    <cite>Total results: {JSON.stringify(answerCount[0].result[0].count)}</cite>
</section>

<section class="results">
    <!-- {#each query[0].result as thing}
            <span>"{thing.transcript}"</span>
    {/each} -->
    <!-- {query[0].result[0].transcript} -->
    <br />
    <!-- {"Biden: "+JSON.stringify(data.props.query[0].result)} -->
    <br />
    <br />

    {"URL: "+JSON.stringify(data.props.post[0].result)}

</section>

<style lang="scss" type="text/scss">
    @import "../../styles/app.scss";
</style>
