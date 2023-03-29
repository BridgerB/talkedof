<script lang=ts>
    export let data;    
    let filter: string = data.props.searchThing;
</script>

<section class="hero">
    <h1>allin pod search</h1>
    <input
        placeholder="Search for transcripts"
        bind:value={filter}
        id="searchInput"
    />
    <a href={filter}>
        <br />       
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"
        ><path
            d="M384 208A176 176 0 1 0 32 208a176 176 0 1 0 352 0zM343.3 366C307 397.2 259.7 416 208 416C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208c0 51.7-18.8 99-50 135.3L507.3 484.7c6.2 6.2 6.2 16.4 0 22.6s-16.4 6.2-22.6 0L343.3 366z"
        /></svg
    >
    </a>
</section>

<section class="results">
    {#each data.props.post[0].result as thing}
        <div class="fade-in-bottom faster results_card">
            <span>"{thing.transcript}"</span>
            <a
                href={thing.url + "&t=" + Math.floor(thing.start / 1000) + "s"}
                target="_blank"
                rel="noreferrer"
                class="results_card_link"
            >
                <!-- TODO: This approach isnt gonna work on mobile. gonna have to show the link all the time -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"
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

<style lang="scss" type="text/scss">
    @import "../../styles/app.scss";
</style>
