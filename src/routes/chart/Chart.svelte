<script>
    import { onMount } from "svelte";
    import Chart from "chart.js/auto";

    export let data;
    export let options;
    export let type = "line";

    let canvas;
    let chart;

    onMount(() => {
        chart = new Chart(canvas, {
            type,
            data,
            options,
        });

        return () => {
            chart.destroy();
        };
    });
</script>
<canvas bind:this={canvas} />