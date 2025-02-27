<script>
  import { Button, Tooltip } from "sveltestrap";
  import moment from "moment";
  import ChatLeftText from "svelte-bootstrap-icons/lib/ChatLeftText";
  import MensajeAlProfesor from "./MensajeAlProfesor.svelte";

  export let notasDetallado = [];
  export let notasDetalladoFull=[];
  export let openMensaje = false;
  let Nota = {};
  let myHtmlElement;
  let htmle;

  const reclamarNota = async (nota) => {
    Nota = { ...nota };
    openMensaje = true;
  };

  const respuestaModal = () => {
    openMensaje = false;
  };

  const iporcentaje = (indice) => {
    console.log(notasDetalladoFull)
      console.log(indice)
      if (indice >= 0 && indice < 3) {
        return "SABER 35%";
      } 
      else if (indice >= 3 && indice < 6) {
        return "HACER 35%";
      }
      else if (indice >= 6 && indice < 9) {
        return "SER 20%";
      } else if (indice == 9 ) {
        return "AUTOEVALUACION 5%";
      }
      else if (indice==10){
        return "COEVALUACION 5%";
      }
    }

    const coloresPorcentaje = (indice) => {
   // console.log(notasDetalladoFull)
   //   console.log(indice)
      if(indice>=0 && indice <3) {
        return "background-color:rgb(231, 255, 231);";
      }
      if (indice >= 3 && indice < 6) {
        return "background-color:rgb(255, 238, 225);";
        
      } else if (indice >= 6 && indice < 9) {
        return "background-color:rgb(240, 245, 255);";
        
      } else if (indice == 9 ) {
        return "background-color:rgb(255, 213, 214);";
      }
      else if (indice==10){
        return "background-color:rgb(255, 250, 214);";

      }
    }
  
</script>

{#if openMensaje}
  <MensajeAlProfesor {Nota} open={openMensaje} on:message={respuestaModal} />
{/if}

<main class="table-responsive">
  <table class="table table-bordered caption-top">
    <caption
      ><h4 class="text-success">
        Profesor:{notasDetallado[0].profesor}
      </h4></caption
    >
    <thead>
      <tr>
        <th>#</th>
        <th>Aspecto</th>
        <th class="text-center">Nota</th>
        <th class="text-center">Fecha</th>
        <th class="text-center">%</th>
        <th class="text-center">Período</th>
        <th class="text-center">Msj&rarr;Prof</th>
      </tr>
    </thead>
    <tbody>
      {#each notasDetallado as { Aspecto, Nota, FechaNota, Porcentaje, Periodo }, i}
        <tr>
          <td class="text-center align-middle">{i + 1}</td>
          <td class="align-middle"
            >{Aspecto != null ? Aspecto : "No hay Aspecto Registrado"}</td
          >
          <td
            class="text-center align-middle"
            class:perdida={parseFloat(Nota) < 3}
            class:blink_me={parseFloat(Nota) < 3}>{Nota != null ? Nota : ""}</td
          >
          <td class="text-center align-middle"
            >{FechaNota != null ? FechaNota : ""}</td
          >
          <td class="text-center align-middle" style={coloresPorcentaje(notasDetalladoFull.findIndex((value) => value.Aspecto==Aspecto && value.Nota==Nota))}
            >{Porcentaje != null ? iporcentaje(notasDetalladoFull.findIndex((value) => value.Aspecto==Aspecto  && value.Nota==Nota)) : "Sin"}</td
          >
          <td class="text-center align-middle">{Periodo}</td>
          <td class="text-center align-middle">
            <Button
              class="rounded-circle"
              color={i % 3 == 0 ? "info" : i % 2 == 0 ? "secondary" : "primary"}
              title="Enviar mensaje al docente para un reclamo de {Aspecto !=
              null
                ? Aspecto
                : ''} con valoracion {Nota}"
              on:click={() => reclamarNota(notasDetallado[i])}
              bind:this={myHtmlElement}
              id="controlledBtn{i}"
            >
              <ChatLeftText />
            </Button>
            <Tooltip placement="right" target="controlledBtn{i}">
              <span class:normal={Aspecto !== null}
                >Enviar mensaje al docente para un reclamo de {Aspecto !== null
                  ? Aspecto
                  : ""} con valoracion
              </span>
              <span
                class:perdida={parseFloat(Nota) < 3}
                class:ganada={parseFloat(Nota) >= 3}>{Nota}</span
              >
            </Tooltip>
          </td></tr
        >
      {/each}
    </tbody>
  </table>
</main>

<style>
  .perdida {
    color: red;
  }

  .ganada {
    color: aqua;
  }

  .normal {
    color: darkorange;
  }

  .blink_me {
    background-color: transparent;
    animation: blinker 0.5s linear infinite;
  }

  @keyframes blinker {
    50% {
      background-color: transparent;
      opacity: 0;
    }
  }
</style>
