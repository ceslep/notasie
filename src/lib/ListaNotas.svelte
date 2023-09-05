<script>
    import ModalDescripcion from "./ModalDescripcion.svelte";
    import ModalInas from "./ModalInas.svelte";
    import ModalNotas from "./ModalNotas.svelte";
    import {
        Button,
        Col,
        Container,
        Row,
        Spinner,
        Icon,
        Alert,
        Tooltip,
        Badge,
    } from "sveltestrap";
    import { afterUpdate, onMount } from "svelte";
    import Eye from "svelte-bootstrap-icons/lib/Eye";
    import Calendar4Week from "svelte-bootstrap-icons/lib/Calendar4Week";
    import CardCheckList from "svelte-bootstrap-icons/lib/CardCheckList";
    import Calculator from "svelte-bootstrap-icons/lib/Calculator";
    import Boxes from "svelte-bootstrap-icons/lib/Boxes";
    import FileEarmarkMedical from "svelte-bootstrap-icons/lib/FileEarmarkMedical/FileEarmarkMedical.svelte";
    import Swal from "sweetalert2";
    import ModalExcusas from "./ModalExcusas.svelte";
    import ModalChart from "./ModalChart.svelte";
    import ModalPuestos from "./ModalPuestos.svelte";

    export let notas = [];
    export let dataEstudiante;
    export let estudiante;
    export let asignacion;
    export let nombres;
    let asignatura;
    export let periodo;
    let valoracion;
    let docente;
    let total;
    let Notas = [];
    let dataC = [];
    let dataC2 = [];
    let dataD = [];
    let dataLabels = [];
    let dataLabels2 = [];
    let dataLabelsD = [];
    let showModalNotas = false;
    let showModalInasistencias = false;
    let showModalExcusas = false;
    let showModalDescripcion = false;
    let showModalChart = false;
    let showModalChartsp = false;
    let showModalChartspu = false;
    let count=0;

    afterUpdate(() => {
        if (notas.length > 0) Notas = [...notas];
    });

    const modalNotas = (asignat) => {
        asignatura = asignat;
        showModalNotas = true;
    };

    const modalExcusas = () => {
        showModalExcusas = true;
    };

    const modalDescripciones = (asignat, valorac, doc) => {
        asignatura = asignat;
        valoracion = valorac;
        docente = doc;
        showModalDescripcion = true;
    };

    const closeModalNotas = (e) => {
        showModalNotas = false;
        console.log(e.detail);
        if (e.detail.text === "no hay notas") {
            Swal.fire({
                title: "No hay Notas",
                text: "",
                icon: "info",
                confirmButtonText: "Aceptar",
            });
        }
    };

    const closeModalInasistencias = (e) => {
        showModalInasistencias = false;
        console.log(e.detail);
        if (e.detail.text === "no hay inasistencias") {
            Swal.fire({
                title: "No hay inasistencias",
                text: "",
                icon: "info",
                confirmButtonText: "Aceptar",
            });
        }
    };

    const closeModalExcusas = (e) => {
        showModalExcusas = false;
        console.log(e.detail);
        if (e.detail.text === "no hay excusas") {
            Swal.fire({
                title: "No hay Excusas",
                text: "",
                icon: "info",
                confirmButtonText: "Aceptar",
            });
        }
    };

    const closeModalDescripcion = (e) => {
        showModalDescripcion = false;
        console.log(e.detail);
        if (e.detail.text === "no hay descripcion") {
            Swal.fire({
                title: "No hay descripción",
                text: "",
                icon: "info",
                confirmButtonText: "Aceptar",
            });
        }
    };

    const openmodalInasistencias = (asignat) => {
        asignatura = asignat;
        showModalInasistencias = true;
    };

    const muestraPromedio = async () => {
        showModalChartsp = !showModalChartsp;
        let response = await fetch(
            "https://app.iedeoccidente.com/est/php/GetPromedios.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    estudiante,
                    periodo,
                    asignacion
                }),
            }
        );
        let dataChart = await response.json();
        console.log(dataChart);
        let response2 = await fetch(
            "https://app.iedeoccidente.com/est/php/GetPromedioGeneral.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    estudiante,
                    periodo,
                    asignacion
                }),
            }
        );
        let dataChart2 = await response2.json();
        console.log(dataChart2);
        dataC = dataChart
            .map((data) => parseFloat(data.valoracion))
            .filter((valoracion) => valoracion > 0);
        console.table(dataC);
        let d2 = [];
        dataChart2.forEach((data) => {
            for (let i = 0; i < dataChart.length; i++) {
                if (
                    dataChart[i].asignatura === data.asignatura &&
                    dataChart[i].valoracion > 0
                )
                    d2.push(data);
            }
        });
        console.log(d2);
        dataC2 = d2.map((data) => parseFloat(data.valoracion));
        console.table(dataC2);
        dataLabels = dataChart
            .filter((d) => d.valoracion > 0)
            .map((data) => data.asignatura);
        dataLabels2 = d2.map((data) => data.asignatura);
        showModalChartsp = !showModalChartsp;

        let desempenos = [...new Set(Notas.map((d) => d.desempeno))];
        console.table(desempenos);
        let dD = [];
        desempenos
            .filter((d) => d != "")
            .forEach((d) => {
                let c = 0;
                Notas.forEach((n) => {
                    if (n.desempeno === d) {
                        c++;
                    }
                });
                let dd = {
                    desempeno: d,
                    cantidad: c,
                };
                dD.push(dd);
            });
        console.table(dD);
        dD = dD.map((d) => {
            return {
                desempeno: d.desempeno,
                porcentaje: parseFloat(
                    (
                        (d.cantidad / dD.reduce((a, b) => a + b.cantidad, 0)) *
                        100
                    ).toFixed(2)
                ),
            };
        });
        dataD = dD.map((d) => d.porcentaje);
        dataLabelsD = dD.map((d) => d.desempeno);
        console.log(dataD);
        console.log(dataLabelsD);
        showModalChart = true;
    };

    const muestraPuestoIE = async (per) => {
        let response = await fetch(
            "https://app.iedeoccidente.com/generaPuestos2.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    asignacion,
                    year: new Date().getFullYear().toString(),
                    periodo: per,
                }),
            }
        );
        return (await response.json()).map((p) => {
            return {
                nombres: p.nombres,
                promedio: p.promedio,
                grupo: p.grupo,
            };
        });
    };

    const muestraPuestoGrupo = async (per) => {
        let response = await fetch(
            "https://app.iedeoccidente.com/generaPuestosGrupo2.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    estudiante,
                    year: new Date().getFullYear().toString(),
                    periodo: per,
                    asignacion
                }),
            }
        );
        return (await response.json()).map((p) => {
            return {
                nombres: p.nombres,
                promedio: p.promedio,
                grupo: p.grupo,
            };
        });
    };

    let puestosIe = [];
    let puestosGrupo = [];
    let showspnpuestos = false;
    let puestosPeriodos = [];

    const getAllPuestos = async () => {
        puestosPeriodos = [];
        puestosPeriodos.length = 0;
        count=0;
        ["UNO", "DOS", "TRES", "CUATRO"].forEach(async (per) => {
            try {
                console.log(per);
                let pie = await muestraPuestoIE(per);
                let pgrupo = await muestraPuestoGrupo(per);
                count++;
                /* let [pie, pgrupo] = await Promise.all([
                    muestraPuestoIE(per),
                    muestraPuestoGrupo(per),
                ]); */
                console.log(pie);
                console.log(pgrupo);

                puestosPeriodos.push({
                    periodo: per,
                    data: { ie: pie, grupo: pgrupo },
                });
                
            } catch (e) {
                console.error("Error al obtener puestos", e);
            }
        });

        /* return new Promise((resolve, reject) => {
            let st;
            while(puestosPeriodos.length!==4){
                console.log("...");
                if(puestosPeriodos.length === 4){
                    clearInterval(st);
                    resolve(puestosPeriodos);
                    break;
                    
                }
                st=setTimeout(() => {
                     reject("Error al obtener puestos");
                }, 10000);
            }
        }); */
    };

    const muestraPuesto = async () => {
        showspnpuestos = true;
        try {
            await getAllPuestos();
            puestosPeriodos= [...puestosPeriodos];
        } catch (e) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Error al obtener puestos",
            });
        }
    };

    const closeModalChart = (e) => {
        showModalChart = false;
    };

    const closeModalPuesto = (e) => {
        showspnpuestos = false;
        showModalChartspu = false;
    };

    let openModalPuestos = false;
    $: if (count>=3) {
        showspnpuestos=false;
        try{
        if ('data' in puestosPeriodos[puestosPeriodos.findIndex((x) => x.periodo === periodo)]) {
        let puestosie =
            puestosPeriodos[
                puestosPeriodos.findIndex((x) => x.periodo === periodo)
            ].data.ie;
            
        let puestosgrupo =
            puestosPeriodos[
                puestosPeriodos.findIndex((x) => x.periodo === periodo)
            ].data.grupo;
        puestosIe=[...puestosie];
        puestosGrupo=[...puestosgrupo];
        }
        console.log(puestosPeriodos);
        showModalChartspu = true;
    }catch(e){
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "Error al obtener puestos",
    });
    }
    }

    
    $: console.log(count);
    
</script>

{#if showModalChart}
    <ModalChart
        Label={"Promedio General"}
        {dataC}
        {dataC2}
        {dataLabels}
        {dataLabels2}
        {dataD}
        {dataLabelsD}
        on:close={closeModalChart}
    />
{/if}

{#if showModalChartspu}
    <ModalPuestos
        estudiante={dataEstudiante.nombres}
        {periodo}
        {puestosPeriodos}
        {puestosIe}
        {puestosGrupo}
        {nombres}
        on:close={closeModalPuesto}
    />
{/if}

{#if showModalNotas}
    <ModalNotas
        {estudiante}
        {asignatura}
        {periodo}
        on:close={closeModalNotas}
    />
{/if}

{#if showModalInasistencias}
    <ModalInas
        {total}
        {estudiante}
        {asignatura}
        {periodo}
        on:close={closeModalInasistencias}
    />
{/if}

{#if showModalExcusas}
    <ModalExcusas {total} {estudiante} {periodo} on:close={closeModalExcusas} />
{/if}

{#if showModalDescripcion}
    <ModalDescripcion
        {estudiante}
        {asignatura}
        {valoracion}
        {periodo}
        {docente}
        on:close={closeModalDescripcion}
    />
{/if}

<template id="puestos">
    <swal-html />
</template>

<Alert color="warning">
    <div class="d-flex justify-content-between align-items-center">
        <div class="floar-left">
            PERIODO {periodo}
        </div>
        <div>
            <Button
                outline
                size="sm"
                style="color:darkmagenta;"
                color="info"
                on:click={muestraPromedio}
            >
                Promedio <Calculator />
                {#if showModalChartsp}
                    <Spinner size="sm" color="warning" />
                {/if}
            </Button>
        </div>
        <div>
            <Button
                outline
                size="sm"
                color="info"
                style="color:navy;"
                on:click={muestraPuesto}
            >
                Puesto<Boxes />
                {#if showModalChartspu || showspnpuestos}
                    <Spinner size="sm" color="warning" />
                {/if}
            </Button>
        </div>
        <div class="float-right">
            <Button
                outline
                size="sm"
                color="danger"
                on:click={() => {
                    modalExcusas();
                }}
                title="Muestra las Excusas del periodo {periodo}"
                >Excusas
                <FileEarmarkMedical />
            </Button>
        </div>
    </div>
</Alert>
<Container fluid>
    {#if Notas.length > 0}
        {#each Notas as nota, i}
            {#if nota.valoracion != ""}
                <Row class="my-1 py-1 border-bottom border-success">
                    <Col sm="3" xs="3" class="align-middle my-2">
                        <span>{nota.asignatura}</span>
                    </Col>
                    <Col sm="2" xs="2" class="text-center  align-middle my-2">
                        <h5
                            class:blink_me={parseFloat(nota.valoracion) < 3}
                            class:perdida={parseFloat(nota.valoracion) < 3}
                        >
                            {nota.valoracion != null
                                ? parseFloat(nota.valoracion).toFixed(2)
                                : ""}
                        </h5>
                    </Col>
                    <Col sm="1" xs="1" class="text-center  align-middle my-2">
                        <h7
                            class="text-center"
                            class:blink_me={parseFloat(nota.valoracion) < 3}
                            class:perdida={parseFloat(nota.valoracion) < 3}
                        >
                            {nota.desempeno !== "BAJO"
                                ? nota.desempeno.substring(0, 2)
                                : "ba"}
                        </h7>
                    </Col>
                    <Col sm="2" xs="2" class="align-middle">
                        <Button
                            color="primary"
                            class="p-1 w-100 w-sm-50 w-md-25 w-lg-25 w-xl-25"
                            on:click={() => {
                                modalNotas(nota.asignatura);
                            }}
                            title="Mostrar Detallado de Notas de {nota.asignatura}"
                            id="htmlButtonNota{i}"
                        >
                            <Eye />
                            {#if [...nota.countNotas].filter((c) => c !== "0").length != 0}
                                <Badge color="danger"
                                    >{[...nota.countNotas].filter(
                                        (c) => c !== "0"
                                    ).length}</Badge
                                >
                            {/if}
                        </Button>
                        <Tooltip target="htmlButtonNota{i}">
                            Mostrar Detallado de Notas de <span
                                class="asignatura">{nota.asignatura}</span
                            >
                        </Tooltip>
                    </Col>
                    <Col sm="2" xs="2" class="align-middle">
                        <Button
                            color="warning"
                            class=" p-1 w-100 w-sm-50 w-md-25 w-lg-25 w-xl-25"
                            on:click={() => {
                                openmodalInasistencias(nota.asignatura);
                            }}
                            title="Mostrar inasistencias del período para {nota.asignatura}"
                        >
                            <Calendar4Week />
                            {#if nota.cantidadInasistencias != 0}
                                <Badge color="success"
                                    >{nota.cantidadInasistencias??""}</Badge
                                >
                            {/if}
                        </Button>
                    </Col>
                    <Col
                        sm="2"
                        xs="2"
                        class="align-middle"
                        title="Mostrar Desempeño de {nota.asignatura}"
                    >
                        <Button
                            color="success"
                            class="p-1 w-100 w-sm-50 w-md-25 w-lg-25 w-xl-25"
                            on:click={() => {
                                modalDescripciones(
                                    nota.asignatura,
                                    nota.valoracion,
                                    nota.docente
                                );
                            }}
                        >
                            <CardCheckList />
                        </Button>
                    </Col>
                </Row>
            {/if}
        {/each}
    {:else}
        <Spinner size="sm" />
    {/if}
</Container>

<style>
    .perdida {
        color: red;
    }

    .asignatura {
        color: greenyellow;
    }

    .blink_me {
        animation: blinker 1s linear infinite;
    }

    @keyframes blinker {
        50% {
            opacity: 0;
        }
    }
</style>
