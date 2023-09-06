<script>
  import { onMount } from "svelte";
  import Archive from "svelte-bootstrap-icons/lib/Eye";
  import Printer from "svelte-bootstrap-icons/lib/Printer";
  import ModalConvivencia from "./ModalConvivencia.svelte";

  export let estudiante;

  const tablaConsolidadoConvivencia = async () => {
    const year = new Date().getFullYear();
    const response = await fetch(
      "https://app.iedeoccidente.com/consolidadoConvivenciaEstudiante.php",
      {
        method: "POST",
        body: JSON.stringify({ estudiante, year }),
      }
    );
    return await response.json();
  };

  let consolidado = [];
  onMount(async () => {
    consolidado = await tablaConsolidadoConvivencia();
  });

  const getConvivencia = async (estudiante) => {
    const year = new Date().getFullYear();
    const { ind } = estudiante;
    const response = await fetch(
      "https://app.iedeoccidente.com/convivenciaDetallado.php",
      {
        method: "POST",
        body: JSON.stringify({ ind, year }),
      }
    );
    return await response.json();
  };

  let info;
  let showModalConvicencia = false;
  const openConvivencia = async (cons) => {
    const [data] = await getConvivencia(cons);
    info =data
    showModalConvicencia = true;
  };
</script>

{#if showModalConvicencia}
  <ModalConvivencia
    {info}
    on:close={() => {
      showModalConvicencia = false;
    }}
  />
{/if}

<main>
  <div class="table-responsive">
    <table
      class="tblc table table-primary table-bordered table-striped table-hover"
    >
      <thead class="table-success table-sticky">
        <tr>
          <th class="text-center align-middle"> # </th>
          <th class="text-center align-middle"> Ver </th>
          <th class="text-center align-middle"> Fecha </th>
          <th class="text-center align-middle"> Hora </th>
          <th class="text-center align-middle"> Reporte/Falta </th>
        </tr>
      </thead>
      <tbody>
        {#each consolidado as { nombres, fecha, hora, tipoFalta, ...cons }, index}
          <tr class="table-primary">
            <td class="table-primary text-center align-middle">
              {index + 1}
            </td>
            <td class="text-center align-middle">
              <button
                on:click={() => {
                  openConvivencia(cons);
                }}
                title={nombres}
                class="btn btn-success ver"
                ><Archive />
                <span
                  class="spinner-border spinner-border-sm spnvcnv d-none"
                  role="status"
                >
                  <span class="visually-hidden">Loading...</span>
                </span>
              </button>
            </td>
            

            <td class="table-primary text-center align-middle">
              {fecha}
            </td>
            <td class="table-primary text-center align-middle">
              {hora}
            </td>
            <td class="table-primary text-center align-middle">
              {tipoFalta}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</main>
