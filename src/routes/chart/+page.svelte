<script>
    import Chart from './Chart.svelte';
    export let data;
    const chartData = {
      // labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
      labels: data.count.result.map(entry => new Date (entry.uploadDate).toISOString().split("T")[0]),
      datasets: [
        {
          label: '# of Votes',
          // data: [12, 19, 3, 5, 2, 3],
          data: data.count.result.map(entry => entry.count),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };
    const options = {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };
  </script>
  <section>
    <h1>Charts</h1>
    <Chart {chartData} {options} type="line" />
  </section>

  

<style lang="scss" type="text/scss">
    @import "../../styles/app.scss";
</style>

