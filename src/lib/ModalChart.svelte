<script>
    import {
        Modal,
        ModalHeader,
        ModalBody,
        ModalFooter,
        Button,
        Spinner,
    } from "sveltestrap";

    import { Chart, registerables } from "chart.js";

    Chart.register(...registerables);

    import { afterUpdate, createEventDispatcher, onMount } from "svelte";

    export let dataC = [];
    export let dataC2 = [];
    export let dataD = [];
    export let dataLabels = [];
    export let dataLabels2 = [];
    export let dataLabelsD = [];

    export let Label;

    let myCanvas;
    let myCanvas2;
    let myCanvasD;

    const dispatch = createEventDispatcher();

    const sendClose = (texti) => {
        console.log("close");
        dispatch("close", {
            text: texti !== "" ? texti : "",
            result: false,
        });
    };

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

    const graph = () => {
        const myChart = new Chart(myCanvas, {
            type: "bar",
            data: {
                labels: dataLabels2,
                datasets: [
                    {
                        label: `${Label} = ${promedio(dataC)}`,
                        data: dataC,
                        borderWidth: 1,
                        borderColor: BorderColors(dataC),
                        backgroundColor: BGcolors(dataC),
                    },
                    {
                        type: "line",
                        label: `${Label} = ${promedio(dataC)}`,
                        data: dataC,
                        borderWidth: 1,
                        borderColor: BorderColors(dataC),
                        backgroundColor: BGcolors(dataC),
                        fill: "start",
                    },
                    {
                        type: "line",
                        label: `${Label} = ${promedio(dataC)}`,
                        data: dataC.map(
                            (d) =>
                                dataC.reduce((a, b) => a + b, 0) / dataC.length
                        ),
                        borderWidth: 1,
                        borderColor: BorderColors(dataC),
                        backgroundColor: BGcolors(dataC),
                        fill: "start",
                    },
                    {
                        type: "line",
                        label: `${Label} Institución = ${promedio(dataC2)}`,
                        data: dataC2.map(
                            (d) =>
                                dataC2.reduce((a, b) => a + b, 0) /
                                dataC2.length
                        ),
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

    const graph2 = () => {
        const myChart = new Chart(myCanvas2, {
            type: "bar",
            data: {
                labels: dataLabels,
                datasets: [
                    {
                        label: `${Label} Institución = ${promedio(dataC2)}`,
                        data: dataC2,
                        borderWidth: 1,
                        borderColor: BorderColors(dataC2),
                        backgroundColor: BGcolors(dataC2),
                    },
                    {
                        type: "line",
                        label: `${Label} Institución = ${promedio(dataC2)}`,
                        data: dataC2,
                        borderWidth: 1,
                        borderColor: BorderColors(dataC2),
                        backgroundColor: BGcolors(dataC2),
                    },
                    {
                        type: "line",
                        label: `${Label} Institución = ${promedio(dataC2)}`,
                        data: dataC2.map(
                            (d) =>
                                dataC2.reduce((a, b) => a + b, 0) /
                                dataC2.length
                        ),
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

    const getOrCreateTooltip = (chart) => {
        let tooltipEl = chart.canvas.parentNode.querySelector("div");

        if (!tooltipEl) {
            tooltipEl = document.createElement("div");
            tooltipEl.style.background = "rgba(0, 0, 0, 0.7)";
            tooltipEl.style.borderRadius = "3px";
            tooltipEl.style.color = "white";
            tooltipEl.style.opacity = 1;
            tooltipEl.style.pointerEvents = "none";
            tooltipEl.style.position = "absolute";
            tooltipEl.style.transform = "translate(-50%, 0)";
            tooltipEl.style.transition = "all .1s ease";

            const table = document.createElement("table");
            table.style.margin = "0px";

            tooltipEl.appendChild(table);
            chart.canvas.parentNode.appendChild(tooltipEl);
        }

        return tooltipEl;
    };

    const externalTooltipHandler = (context) => {
        // Tooltip Element
        const { chart, tooltip } = context;
        const tooltipEl = getOrCreateTooltip(chart);

        // Hide if no tooltip
        if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = 0;
            return;
        }

        // Set Text
        if (tooltip.body) {
            const titleLines = tooltip.title || [];
            const bodyLines = tooltip.body.map((b) => b.lines);

            const tableHead = document.createElement("thead");

            titleLines.forEach((title) => {
                const tr = document.createElement("tr");
                tr.style.borderWidth = "0";

                const th = document.createElement("th");
                th.style.borderWidth = "0";
                const text = document.createTextNode(title);

                th.appendChild(text);
                tr.appendChild(th);
                tableHead.appendChild(tr);
            });

            const tableBody = document.createElement("tbody");
            bodyLines.forEach((body, i) => {
                const colors = tooltip.labelColors[i];

                const span = document.createElement("span");
                span.style.background = colors.backgroundColor;
                span.style.borderColor = colors.borderColor;
                span.style.borderWidth = "2px";
                span.style.marginRight = "10px";
                span.style.height = "10px";
                span.style.width = "10px";
                span.style.display = "inline-block";

                const tr = document.createElement("tr");
                tr.style.backgroundColor = "inherit";
                tr.style.borderWidth = "0";

                const td = document.createElement("td");
                td.style.borderWidth = "0";

                const text = document.createTextNode(body);

                td.appendChild(span);
                td.appendChild(text);
                tr.appendChild(td);
                tableBody.appendChild(tr);
            });

            const tableRoot = tooltipEl.querySelector("table");

            // Remove old children
            while (tableRoot.firstChild) {
                tableRoot.firstChild.remove();
            }

            // Add new children
            tableRoot.appendChild(tableHead);
            tableRoot.appendChild(tableBody);
        }

        const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

        // Display, position, and set styles for font
        tooltipEl.style.opacity = 1;
        tooltipEl.style.left = positionX + tooltip.caretX + "px";
        tooltipEl.style.top = positionY + tooltip.caretY + "px";
        tooltipEl.style.font = tooltip.options.bodyFont.string;
        tooltipEl.style.padding =
            tooltip.options.padding + "px " + tooltip.options.padding + "px";
    };

    const graphD = () => {
        const myChart = new Chart(myCanvasD, {
            type: "polarArea",
            data: {
                labels: dataLabelsD.map((d, i) => `${d} ${dataD[i]} %`),
                datasets: [
                    {
                        label: `Desempeños`,
                        data: dataD,
                        borderWidth: 1,
                        borderColor: BorderColors(dataD),
                        backgroundColor: BGcolors(dataD),
                    },
                ],
            },

            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
                plugins: {
                    title: {
                        display: true,
                        text: "Porcentajes de Desempeños",
                    },
                    tooltip: {
                        enabled: false,
                        position: "nearest",
                        external: externalTooltipHandler,
                    },
                },
            },
        });
    };
    afterUpdate(() => {});

    $: if (myCanvas) graph();
    $: if (myCanvas2) graph2();
    $: if (myCanvasD) graphD();
</script>

<Modal isOpen={true} scrollable fullscreen size={"lg"}>
    <ModalHeader class="bg-info text-dark" toggle={sendClose}
        >Promedio</ModalHeader
    >
    <ModalBody>
        <div class="m-md-1 p-md-1 m-lg-2 p-lg-2 m-xl-3 p-xl-3 m-xxl-5 p-xxl-5">
            <canvas id="mychart" bind:this={myCanvas} />
            <canvas id="mychart2" bind:this={myCanvas2} />
            <canvas id="mychartD" bind:this={myCanvasD} />
        </div>
    </ModalBody>
    <ModalFooter>
        <Button color="secondary" on:click={sendClose}>Cerrar</Button>
    </ModalFooter>
</Modal>
