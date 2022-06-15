<script lang="ts">
	import Descripcion from './Descripcion.svelte';
    import {
      Button,
      Card,
      CardBody,
      CardFooter,
      CardHeader,
      CardSubtitle,
      CardText,
      CardTitle
    } from 'sveltestrap';

    export let tipoFalta;
    export let fecha;
    export let descripcionSituacion;
    export let descargos;
    export let firma;
    export let faltas;
    export let hora;
  </script>
  
  <Card class="mb-3">
    <CardHeader>
      <CardTitle>
        {#if tipoFalta!=="POSITIVO"}
        Tipo de Falta: {tipoFalta}
        {:else}
        Felicitaciones
        {/if}
      </CardTitle>
    </CardHeader>
    <CardBody>
      <CardSubtitle>Fecha: {fecha} {hora}</CardSubtitle>
      <CardText>
        
         {#if tipoFalta!=="POSITIVO"}
          <span>Descripción de la(s) falta(s) según el manual de convivencia</span>
          {:else}
          <span>Se ha registrado una felicitación por parte del docente</span>
          <div class="d-flex justify-content-center align-items-center">
          <img class="img-fluid" width="25%" src="./medalla.png" alt="Medalla">
          </div>
          {/if}
          <p>
            {faltas}
          </p>
          {#if tipoFalta!=="POSITIVO"}
          <span class="text-success"><strong>Descripción de la situación</strong></span>
          {:else}
          <span class="text-success"><strong>Una observación de caracter positivo siempre es un aliciente para el futuro del estudiante.</strong></span>
          {/if}
          
          <p class="text-primary">
              {descripcionSituacion}
          </p>
          <div class="alert alert-danger" class:positivo={tipoFalta==="POSITIVO"} role="alert">
            {#if tipoFalta!=="POSITIVO"}
              <strong>Descargos del Estudiante</strong>
              {:else}
              <strong>Información de convivencia Positiva</strong>
            {/if}  
              <p class="text-justify">
                  {descargos}
              </p>
          </div>
          <span>Firma:</span>
          <img class="img-fluid" src={firma} on:error={function () {
            this.src = "./estudiante.png";
            this.width = "60";
        }} alt="firma"/>
          

        
      </CardText>
      
    </CardBody>
    <CardFooter><span class="text-success d-flex justify-content-center font-weight-bold">Comite de convivencia I.E. de Occidente {new Date().getFullYear()}</span></CardFooter>
  </Card>

  <style>
    .positivo{
      background-color:lightblue;
      color:blue;
    }
    </style>