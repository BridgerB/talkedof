<script>
    import { onMount } from "svelte";
    import Chart from "chart.js/auto";

    export let chartData;
    export let options;
    export let type = "line";

    let canvas;
    let chart;

    onMount(() => {
        chart = new Chart(canvas, {
            type,
            data: chartData,
            options,
        });

        return () => {
            chart.destroy();
        };
    });
</script>
<canvas bind:this={canvas} />
