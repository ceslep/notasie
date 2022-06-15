<script>
    import { Chart, registerables } from "chart.js";
    import { afterUpdate } from "svelte";

    Chart.register(...registerables);

    export let dataC = [];
    export let dataC2 = [];
    export let dataLabels = [];
    export let dataLabels2 = [];

    export let Label;

    let myCanvas;
    let myCanvas2;

    const BGcolors = (dataCl) => {
        return dataCl.map((_) => {
            return `rgba( ${Math.floor(
                100 + 155 * Math.random()
            ).toString()}, ${Math.floor(
                100 + 155 * Math.random()
            )}, ${Math.floor(100 + 155 * Math.random())},0.7)`;
        });
    };

    const BorderColors = (dataCl) => {
        return dataCl.map((_) => {
            return `rgb( ${Math.floor(
                50 + 155 * Math.random()
            ).toString()}, ${Math.floor(
                50 + 155 * Math.random()
            )}, ${Math.floor(50 + 155 * Math.random())})`;
        });
    };

    const promedio = (dataCl) => {
        return (dataCl.reduce((a, b) => a + b, 0) / dataCl.length).toFixed(2);
    };

    let myChart;
    let myChart2;

    const graph = () => {
        myChart = new Chart(myCanvas, {
            type: "line",
            data: {
                labels: dataLabels2,
                datasets: [
                    {
                        label: `${Label} `,
                        data: dataC,
                        borderWidth: 1,
                        borderColor: BorderColors(dataC),
                        backgroundColor: BGcolors(dataC),
                        pointBackgroundColor: BorderColors(dataC),
                        pointBorderColor: BorderColors(dataC),
                        pointHoverBackgroundColor: BorderColors(dataC),
                        pointHoverBorderColor: BorderColors(dataC),
                        pointRadius: 0,
                        pointHitRadius: 10,
                        pointBorderWidth: 2,
                        pointStyle: "rectRounded",
                        

                    },
                    {
                        label: `${Label} `,
                        type:"bar",
                        data: dataC,
                        borderWidth: 1,
                        borderColor: BorderColors(dataC),
                        backgroundColor: BGcolors(dataC),
                        
                        

                    },
                ],
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        reverse: false,
                    },
                },
            },
        });
        myChart.options.elements.line.tension = 0.4;
    };

    const graph2 = () => {
        myChart2 = new Chart(myCanvas2, {
            type: "bar",
            data: {
                labels: dataLabels,
                datasets: [
                    {
                        label: `${Label} Grupo`,
                        data: dataC2,
                        borderWidth: 1,
                        borderColor: BorderColors(dataC2),
                        backgroundColor: BGcolors(dataC2),
                    },
                ],
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        
                    },
                },
            },
        });
        myChart.options.elements.line.tension = 0.4;
    };

    $: if (myCanvas) {
        if (myChart) myChart.destroy();
        graph();
    }
    $: if (myCanvas2) {
        if (myChart2) myChart2.destroy();
        graph2();
    }

    afterUpdate(() => {
     
        if (myChart) myChart.destroy();
        if (myChart2) myChart2.destroy();
        if (myCanvas) graph();
        if (myCanvas2) graph2();
    });
</script>

<main>
    <canvas id="mychart" bind:this={myCanvas} />
    <canvas id="mychart2" bind:this={myCanvas2} />
</main>
