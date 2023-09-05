<script>
  import { onMount } from "svelte";
  import ModalConvivencia from "./ModalConvivencia.svelte";
  import { TabContent, TabPane, Spinner, Alert, Image } from "sveltestrap";
  import Convivencia from "./Convivencia.svelte";
  import ListaNotas from "./ListaNotas.svelte";
  import ModalMap from "./ModalMap.svelte";
  import ModalViewFoto from "./ModalViewFoto.svelte";
  import Spn from "./Spn.svelte";
  import ListaNotasConcentrador from "./ListaNotasConcentrador.svelte";
  export let dataEstudiante;
  export let estudiante;
  export let periodo;
  export let nombres;
  export let dataRegistro;
  export let nivel;
  export let numero;
  export let asignacion;
  let viewMap = false;
  let datosConvivencia = [];

  let email = "";
  let photoURL = "";
  let viewPhoto = false;
  let fs6 = "fs-6";

  let active1 = false;
  let active2 = false;
  let active3 = false;
  let active4 = false;

  let dataPeriodo = [];
  let datosLocal = [];

  let blinking = false;

  $: active1 = periodo === "UNO" ? true : false;
  $: active2 = periodo === "DOS" ? true : false;
  $: active3 = periodo === "TRES" ? true : false;
  $: active4 = periodo === "CUATRO" ? true : false;

  $: if (dataRegistro) {
    email = dataRegistro.email;
    photoURL = dataRegistro.photoURL;
  }

  let positivo = false;
  const detectConvivencia = async () => {
    let convivencia = await fetch(
      `https://app.iedeoccidente.com/est/php/getConvivencia.php`,
      {
        method: "POST",
        body: JSON.stringify({
          estudiante,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    let data = await convivencia.json();
    console.log(data);
    return;
    datosConvivencia = data;
    positivo =
      datosConvivencia.findIndex((dc) => dc.tipoFalta === "POSITIVO") >= 0;
  };

  $: blinking = datosConvivencia.length > 0 ? true : false;

  onMount(async () => {
    await detectConvivencia();
  });

  async function getData(periodo) {
    let response = await fetch(
      "https://app.iedeoccidente.com/est/php/getNotas.php",
      {
        method: "POST",
        body: JSON.stringify({
          periodo,
          estudiante,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    let result = await response.json();
    /* try {
            let Dl = JSON.parse(localStorage.getItem("data"));
            console.log(Dl);
            if (!Dl)
                datosLocal = [
                    {
                        nombres: `${nombres} ${nivel}-${numero}`,
                        periodo: periodo,
                        datos: result,
                    },
                ];
            else {
                let index = Dl.findIndex((x) => x.periodo === periodo);
                if (index != -1)
                    datosLocal[index] = {
                        nombres: `${nombres} ${nivel}-${numero}`,
                        periodo,
                        datos: result,
                    };
                else
                    datosLocal.push({
                        nombres: `${nombres} ${nivel}-${numero}`,
                        periodo,
                        datos: result,
                    });
            }
            console.log(datosLocal);
            localStorage.setItem(`data`, JSON.stringify(datosLocal));
        } catch (e) {
            console.log(e);
            localStorage.clear;
           
        }finally{
            return result;
        } */
    return result;
  }

  async function tabChange(e) {
    dataPeriodo = [];
    periodo = e.detail;
    console.log(periodo);
    dataPeriodo = await getData(periodo);
    console.log(dataPeriodo);
    /*  let next =
            dataPeriodo[0].countNotas && dataPeriodo[0].countNotas.length >0
                ? true
                : false;
        if (next) {
            let datacc = [];
            dataPeriodo[0].countNotas.forEach((data) => {
                data.forEach((count) => {
                    datacc.push(count);
                });
            });
            datacc = datacc.map((data) => {
                return {
                    asignatura: data.asignatura,
                    count: Array.from(data.countNotas)
                        .map((el) => parseInt(el))
                        .reduce((a, b) => a + b),
                };
            });
            datacc = datacc.sort((a, b) => {
                if (b.asignatura < a.asignatura) return 1;
                else return -1;
            });
            let dataccg = [];
            let asigt = "";
            let aasig = datacc.map((data) => data.asignatura);
            aasig.forEach((data) => {
                let c = 0;
                datacc.forEach((dd) => {
                    if (dd.asignatura === data) {
                        c += dd.count;
                    }
                });
                if (dataccg.findIndex((dd) => dd.asignatura === data) === -1) {
                    dataccg.push({ asignatura: data, count: c });
                }
            });

            dataccg.forEach((data) => {
                if (
                    dataPeriodo.findIndex(
                        (dd) => dd.asignatura === data.asignatura
                    ) !== -1
                )
                    dataPeriodo[
                        dataPeriodo.findIndex(
                            (dd) => dd.asignatura === data.asignatura
                        )
                    ].countNotas = Array(data.count).fill(1).join("");
            });
            console.log(dataccg);
        }

        console.log(dataPeriodo, dataRegistro); */
  }

  const openModalPhoto = () => {
    viewPhoto = true;
  };

  const closeModalPhoto = () => {
    viewPhoto = false;
  };

  const openModalMap = async () => {
    await getDataMap();
    viewMap = true;
  };

  export let markerLocations = [];
  const getDataMap = async () => {
    let response = await fetch(
      "https://app.iedeoccidente.com/est/php/GetDataMap.php",
      {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    let locations = await response.json();

    locations = locations.filter(
      (location) => location.coords != "" && location.coords != "{}"
    );
    console.log(locations);
    markerLocations = locations.map((location) => {
      return [
        parseFloat(location.coords.substring(0, location.coords.indexOf(","))),
        parseFloat(location.coords.substring(location.coords.indexOf(",") + 1)),
        location.estudiante,
        location.nombres,
        location.nivel,
        location.numero,
      ];
    });
    markerLocations = markerLocations.map((location) => {
      return String([
        location[0].toFixed(4),
        location[1].toFixed(4),
        location[2],
        location[3],
        location[4],
        location[5],
      ]);
    });

    console.log(markerLocations);
    markerLocations = [...new Set(markerLocations)];
    console.log(markerLocations);
    markerLocations = markerLocations.map((location) => {
      return location.split(",").map((x) => {
        return !isNaN(parseFloat(x)) ? parseFloat(x) : x;
      });
    });
    console.log(markerLocations);
  };

  let viewConvivencia = false;

  const openModalConvivencia = () => {
    viewConvivencia = true;
  };
</script>

{#if viewConvivencia}
  <ModalConvivencia
    {positivo}
    {datosConvivencia}
    on:close={() => {
      viewConvivencia = false;
    }}
  />
{/if}

{#if viewPhoto}
  <ModalViewFoto {photoURL} on:close={closeModalPhoto}>
    <div class="text-center">
      <br />
      <span class="fs-6">{nombres}</span>
      <br />
      {estudiante}
      <br />
      <a href="mailto:{email}" class="fs-6" target="_blank">{email}</a>
    </div>
  </ModalViewFoto>
{/if}

<main>
  {#if viewMap}
    <div class="mt-5">
      <ModalMap {markerLocations} on:close={() => (viewMap = !viewMap)} />
    </div>
  {:else}
    <Alert
      color="primary"
      class="bg-gradient d-flex justify-content-between align-items-center lh-1 text-decoration-none"
      ><a href="#!" class="fs-7 text-decoration-none"
        >{nombres}<br />
        {estudiante}<br /> <span class="fs-6">{email??""}</span></a
      >

      {#if photoURL !== ""}
        <a href="#!" on:click={openModalPhoto}>
          <img
            alt=""
            src={photoURL}
            class="img-fluid rounded-circle"
            width="60"
            height="60"
            on:error={() => (photoURL = "./estudiante.png")}
          />
        </a>
      {/if}
      <div>
        <h1>
          <a
            class="text-decoration-none"
            href="#!"
            on:click|preventDefault={openModalMap}>{nivel}-{numero}</a
          >
        </h1>
      </div>
    </Alert>
    {#if blinking}
      <Convivencia {positivo} {blinking} on:click={openModalConvivencia} />
    {/if}
    <TabContent on:tab={tabChange}>
      <TabPane tabId="UNO" tab="P1" active={active1}>
        {#if dataPeriodo.length > 0 && periodo === "UNO"}
          <ListaNotas
            {dataEstudiante}
            {estudiante}
            {periodo}
            notas={dataPeriodo}
            {asignacion}
            {nombres}
          />
        {:else}
          <div
            class="d-flex justify-content-center align-items-center h-75 position-relative p-5 m-5"
          >
            <Spn />
          </div>
        {/if}
      </TabPane>
      <TabPane tabId="DOS" tab="P2" active={active2}>
        {#if dataPeriodo.length > 0 && periodo === "DOS"}
          <ListaNotas
            {dataEstudiante}
            {estudiante}
            {periodo}
            notas={dataPeriodo}
            {asignacion}
            {nombres}
          />
        {:else}
          <div
            class="d-flex justify-content-center align-items-center h-75 position-relative p-5 m-5"
          >
            <Spn />
          </div>
        {/if}
      </TabPane>
      <TabPane tabId="TRES" tab="P3" active={active3}>
        {#if dataPeriodo.length > 0 && periodo === "TRES"}
          <ListaNotas
            {dataEstudiante}
            {estudiante}
            {periodo}
            notas={dataPeriodo}
            {asignacion}
            {nombres}
          />
        {:else}
          <div
            class="d-flex justify-content-center align-items-center h-75 position-relative p-5 m-5"
          >
            <Spn />
          </div>
        {/if}
      </TabPane>
      <TabPane tabId="CUATRO" tab="P4" active={active4}>
        {#if dataPeriodo.length > 0 && periodo === "CUATRO"}
          <ListaNotas
            {dataEstudiante}
            {estudiante}
            {periodo}
            notas={dataPeriodo}
            {asignacion}
            {nombres}
          />
        {:else}
          <div
            class="d-flex justify-content-center align-items-center h-75 position-relative p-5 m-5"
          >
            <Spn />
          </div>
        {/if}
      </TabPane>
      <TabPane tabId="FINAL" tab="Final">
        {#if dataPeriodo.length > 0 && periodo === "FINAL"}
          <ListaNotas
            {dataEstudiante}
            {estudiante}
            {periodo}
            notas={dataPeriodo}
            {asignacion}
            {nombres}
          />
        {:else}
          <div
            class="d-flex justify-content-center align-items-center h-75 position-relative p-5 m-5"
          >
            <Spn />
          </div>
        {/if}
      </TabPane>
      <TabPane tabId="Concentrador" tab="Concentrador">
        {#if dataPeriodo.length > 0 && periodo === "Concentrador"}
          <ListaNotasConcentrador
            notas={dataPeriodo.map((dp) => {
              const { asignatura, periodo, valoracion, desempeno } = dp;
              return {
                asignatura,
                periodo,
                valoracion,
                desempeno,
              };
            })}
          />
        {:else}
          <div
            class="d-flex justify-content-center align-items-center h-75 position-relative p-5 m-5"
          >
            <Spn />
          </div>
        {/if}
      </TabPane>
    </TabContent>
  {/if}
</main>

<style>
  .fs-7 {
    font-size: 0.75rem;
  }
</style>
