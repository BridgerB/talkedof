<script lang="ts">
    import { goto } from "$app/navigation";
    import Chart from "./Chart.svelte";

    export let data;
    let filter: string = data.searchThing;
    async function search() {
        try {
            await goto(filter);
        } catch (error) {
            console.error("Failed to navigate:", error);
        }
    }
    const checkEnter = (e) => {
        if (e.charCode === 13) search();
    };
    const chartData = {
        // labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        labels: data.answerCount.result.map(
            (entry) => new Date(entry.uploadDate).toISOString().split("T")[0]
        ),
        datasets: [
            {
                label: "# of mentions over time",
                // data: [12, 19, 3, 5, 2, 3],
                data: data.answerCount.result.map((entry) => entry.count),
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
            },
        ],
    };
    const options = {
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };
</script>

<section class="hero">
    <h1>{data.subdomain} search</h1>
    <input
        placeholder="Search for transcripts"
        bind:value={filter}
        on:keypress={checkEnter}
        id="searchInput"
    />
    <button on:click={search}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
            ><path
                d="M384 208A176 176 0 1 0 32 208a176 176 0 1 0 352 0zM343.3 366C307 397.2 259.7 416 208 416C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208c0 51.7-18.8 99-50 135.3L507.3 484.7c6.2 6.2 6.2 16.4 0 22.6s-16.4 6.2-22.6 0L343.3 366z"
            /></svg
        >
    </button>
</section>

{#each data.post[0].result as video}
    {#if video.transcripts.length > 0}
        <br />
        <div style="text-align:center;">
            <h2>{video.title}</h2>
            <p>{new Date(video.uploadDate).toDateString()}</p>
            <!-- <img src={video.thumbnailUrl} alt="thumnail" width="500" height="300"> -->
            <!-- <p>{JSON.stringify(video.videoId)}</p> -->
            <iframe width="560" height="315" src="https://www.youtube.com/embed/{video.videoId}?start={Math.floor(video.transcripts[0].startMs / 1000)}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>

        
        <br />
        <section class="results">
            {#each video.transcripts as transcript}
                <div class="fade-in-bottom faster results_card">
                    <span>
                        "{transcript.transcript}" 
                        <!-- <br /> -->
                        <!-- ({Math.floor(transcript.startMs / 1000)} seconds) -->
                    </span>
                    <a
                        href={`https://www.youtube.com/watch?v=${
                            video.videoId
                        }&t=${Math.floor(transcript.startMs / 1000)}s`}
                        target="_blank"
                        rel="noreferrer"
                        class="results_card_link"
                    >
                        <!-- TODO: This approach isnt gonna work on mobile. gonna have to show the link all the time -->
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 640 512"
                            ><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><defs
                                ><style>
                                    .fa-secondary {
                                        opacity: 0.4;
                                    }
                                </style></defs
                            ><path
                                class="fa-primary"
                                d="M256 128c0-17.7-14.3-32-32-32s-32 14.3-32 32V384c0 17.7 14.3 32 32 32s32-14.3 32-32V128zm192 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V352c0 17.7 14.3 32 32 32s32-14.3 32-32V160zM0 256a32 32 0 1 0 64 0A32 32 0 1 0 0 256zm576 0a32 32 0 1 0 64 0 32 32 0 1 0 -64 0z"
                            /><path
                                class="fa-secondary"
                                d="M320 0c17.7 0 32 14.3 32 32V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V32c0-17.7 14.3-32 32-32zM512 64c17.7 0 32 14.3 32 32V416c0 17.7-14.3 32-32 32s-32-14.3-32-32V96c0-17.7 14.3-32 32-32zM128 192c17.7 0 32 14.3 32 32v64c0 17.7-14.3 32-32 32s-32-14.3-32-32V224c0-17.7 14.3-32 32-32z"
                            /></svg
                        > listen
                    </a>
                </div>
            {/each}
        </section>
    {/if}
{/each}
<br />
<br />
<br />
<br />
<br />
<section>
    <Chart {chartData} {options} type="line" />
</section>

<style lang="scss" type="text/scss">
    @import "../../styles/app.scss";
    h2 {
        font-size: 22px;
    }
    p {
        font-size: 16px;
    }
</style>
