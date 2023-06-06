<script>
  // Import the necessary Svelte functions
  import { writable } from "svelte/store";
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";

  // Constants
  const SPECIFIC_HEAT_CAPACITY_WATER = 4.18;
  const THERMAL_CONDUCTIVITY_WATER = 0.57864;

  // Variables
  let efficiency = 1,
    area = 47,
    flow_rate = 47,
    volume = 47,
    thermal_efficiency = 1,
    initial_temperature = 47,
    sunlight_intensity = 1361,
    duration = 30;
  let simulationData = writable([]);
  let chart;
  let miny = +Infinity,
    maxy = -Infinity,
    highest;

  // Helper functions
  function run_simulation() {
    // Reset miny and maxy
    miny = +Infinity;
    maxy = -Infinity;

    // Variables
    let water_temperature = initial_temperature;
    let tank_temperature = initial_temperature;
    let simulationResults = [];

    // Simulation
    for (let i = 0; i < duration; i++) {
      // Calculate new sunlight intensity
      let new_sunlight_intensity =
        sunlight_intensity *
        Math.sin((i / (duration * 1440)) * 2 * Math.PI);
      new_sunlight_intensity = Math.max(new_sunlight_intensity, 0);

      // Collect energy
      let temperature_efficiency_factor = Math.max(
        0,
        1 - 0.01 * (water_temperature - 25)
      );
      let adjusted_efficiency = efficiency * temperature_efficiency_factor;
      let energy_collected = adjusted_efficiency * area * new_sunlight_intensity;

      if (energy_collected > 0) {
        water_temperature +=
          energy_collected /
          (flow_rate * 1000 * SPECIFIC_HEAT_CAPACITY_WATER);
      } else {
        water_temperature -=
          (THERMAL_CONDUCTIVITY_WATER *
            area *
            (water_temperature - 4)) /
          (flow_rate * 1000 * SPECIFIC_HEAT_CAPACITY_WATER);
      }

      // Update tank temperature
      const mass = volume;
      const incoming_energy =
        flow_rate *
        water_temperature *
        SPECIFIC_HEAT_CAPACITY_WATER *
        1000;
      const outgoing_energy =
        flow_rate *
        tank_temperature *
        SPECIFIC_HEAT_CAPACITY_WATER *
        1000;
      const new_temperature =
        (mass * tank_temperature * SPECIFIC_HEAT_CAPACITY_WATER * 1000 +
          incoming_energy -
          outgoing_energy) /
        (mass * SPECIFIC_HEAT_CAPACITY_WATER * 1000);
      tank_temperature = new_temperature * thermal_efficiency;

      // Save data
      simulationResults.push({
        time: i,
        temp: tank_temperature,
        sunlight: new_sunlight_intensity,
      });

      // Update miny, maxy, and highest
      if (tank_temperature < miny) {
        miny = tank_temperature;
      }
      if (tank_temperature > maxy) {
        maxy = tank_temperature;
        highest = simulationResults[i];
      }
    }

    // Update chart
    if (chart) {
      chart.data.labels = simulationResults.map((d) => d.time);
      chart.data.datasets[0].data = simulationResults.map((d) => d.temp);
      chart.data.datasets[1].data = simulationResults.map((d) => d.sunlight);
      chart.options.scales.y.suggestedMin = miny;
      chart.options.scales.y.suggestedMax = maxy;
      chart.update();
    }

    // Update simulation data
    simulationData.set(simulationResults);
    console.log(simulationResults);
  }

  // On mount
  onMount(() => {
    var ctx = document.getElementById("myChart").getContext("2d");
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Tank Temperature (°C)",
            data: [],
            borderColor: "rgb(255, 99, 132)",
            fill: false,
            yAxisID: "y",
          },
          {
            label: "Sunlight Intensity (W/m²)",
            data: [],
            borderColor: "rgb(75, 192, 192)",
            fill: false,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: "Time",
            },
          },
          y: {
            title: {
              display: true,
              text: "Tank Temperature (°C)",
            },
          },
          y1: {
            title: {
              display: true,
              text: "Sunlight Intensity (W/m²)",
            },
            position: "right",
          },
        },
      },
    });

    // Run the simulation immediately
    run_simulation();
  });
</script>

<h1>Solar Collector Simulation</h1>
<div>
  <form>
    <label for="efficiency">Efficiency: </label>
    <input
      id="efficiency"
      bind:value={efficiency}
      type="number"
      required
      on:input={run_simulation}
    />
    <br />

    <label for="area">Area: </label>
    <input
      id="area"
      bind:value={area}
      type="number"
      required
      on:input={run_simulation}
    />
    <br />

    <label for="flow_rate">Flow Rate: </label>
    <input
      id="flow_rate"
      bind:value={flow_rate}
      type="number"
      required
      on:input={run_simulation}
    />
    <br />

    <label for="volume">Volume: </label>
    <input
      id="volume"
      bind:value={volume}
      type="number"
      required
      on:input={run_simulation}
    />
    <br />

    <label for="thermal_efficiency">Thermal Efficiency: </label>
    <input
      id="thermal_efficiency"
      bind:value={thermal_efficiency}
      type="number"
      required
      on:input={run_simulation}
    />
    <br />

    <label for="initial_temperature">Initial Temperature: </label>
    <input
      id="initial_temperature"
      bind:value={initial_temperature}
      type="number"
      required
      on:input={run_simulation}
    />
    <br />

    <label for="sunlight_intensity">Sunlight Intensity: </label>
    <input
      id="sunlight_intensity"
      bind:value={sunlight_intensity}
      type="number"
      required
      on:input={run_simulation}
    />
    <br />

    <label for="duration">Duration: </label>
    <input
      id="duration"
      bind:value={duration}
      type="number"
      required
      on:input={run_simulation}
    />
    <br />
  </form>
</div>

<div class="chart">
  <canvas id="myChart" />
</div>

{#if $simulationData.length > 0}
  <h2>Simulation Results</h2>
  <ul>
    {#each $simulationData as data (data.time)}
    <li>
      Time: {data.time} - Temperature: {data.temp} - Sunlight: {data.sunlight}
    </li>
    {/each}
  </ul>
{/if}

<style>
    .chart {
        width: 80%; /* Chart width */
        height: auto; /* Chart height */
        margin: 0 auto; /* Center the chart on the page */
    }

    form {
        margin-bottom: 1em; /* Add some space below the form */
    }

    form label {
        display: block; /* Display labels on their own line */
    }

    form input {
        margin-bottom: 0.5em; /* Add some space below each input field */
    }

    form button {
        cursor: pointer; /* Indicate that the button is clickable */
        padding: 0.5em 1em; /* Add some padding to the button */
        background-color: #4caf50; /* Set the background color */
        color: white; /* Set the text color */
        border: none; /* Remove the default border */
    }

    form button:hover {
        background-color: #45a049; /* Add a hover effect */
    }

    h2 {
        margin-top: 1em; /* Add some space above the heading */
    }
</style>
