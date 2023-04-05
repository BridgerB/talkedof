<script>
    import Chart from './Chart.svelte';
  
    const data = {
      labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
      datasets: [
        {
          label: '# of Votes',
          data: [12, 19, 3, 5, 2, 3],
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
    <Chart {data} {options} type="bar" />
  </section>

  

<!-- <style lang="scss" type="text/scss">
    @import "../../styles/app.scss";
</style> -->

