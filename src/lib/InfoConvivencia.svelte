<script>
  export let nombres;
  export let cv_docente;
  export let cv_asignatura;
  export let cv_tipoFalta;
  export let cv_fecha;
  export let cv_hora;
  export let cv_faltas;
  export let cv_descripcionSituacion;
  export let cv_descargosEstudiante;
  export let cv_positivos;
  export let cv_firma;
  export let firmaAcudiente;
  export let cv_fechahora;
</script>

<!-- Coloca los elementos HTML en el componente Svelte -->
<div class="row">
  <div class="col-12 col-sm-12 col-md-12 col-lg-6">
    <div class="form-group">
      <label for="cv_docente" class="fw-bold">Reportado por el Docente</label>
      <!-- Utiliza bind:value para vincular el contenido del input con la variable cv_docente -->
      <input
        type="text"
        name="cv_docente"
        id="cv_docente"
        class="form-control"
        readonly
        bind:value={cv_docente}
      />
    </div>
  </div>
  <div class="col-12 col-sm-12 col-md-12 col-lg-6">
    <div class="form-group">
      <label for="cv_asignatura" class="fw-bold">Asignatura</label>
      <input
        type="text"
        name="cv_asignatura"
        id="cv_asignatura"
        class="form-control"
        readonly
        bind:value={cv_asignatura}
      />
    </div>
  </div>
  <div class="col-sm-12 col-md-6 col-lg-6">
    <div class="form-group">
      {#if !cv_tipoFalta.includes("POSITIVO")}
        <label id="cvtf" for="cv_tipoFalta" class="fw-bold">Tipo Falta</label>
      {:else}
        <label id="cvtf" for="cv_tipoFalta" class="fw-bold">Reporte</label>
      {/if}
      <input
        type="text"
        name="cv_tipoFalta"
        id="cv_tipoFalta"
        class="form-control"
        readonly
        bind:value={cv_tipoFalta}
      />
    </div>
  </div>
  <div class="col-sm-12 col-md-6 col-lg-6">
    <div class="form-group">
      <label for="cv_fecha" class="fw-bold">Fecha</label>
      <input
        type="text"
        name="cv_fecha"
        id="cv_fecha"
        class="form-control"
        readonly
        bind:value={cv_fecha}
      />
    </div>
  </div>
  <div class="col-12 col-sm-6 col-md-6 col-lg-6">
    <div class="form-group">
      <label for="cv_hora" class="fw-bold">Hora</label>
      <input
        type="text"
        name="cv_hora"
        id="cv_hora"
        class="form-control"
        readonly
        bind:value={cv_hora}
      />
    </div>
  </div>
</div>
<div class="row">
  <div class="col-12">
    {#if cv_faltas}
      <!-- content here -->
      <label for="cv_faltas" class="fw-bold">Faltas</label>
   
    <!-- Utiliza bind:value para vincular el contenido del textarea con la variable cv_faltas -->
    <textarea
      readonly
      class="form-control autoheight fst-italic"
      name="cv_faltas"
      id="cv_faltas"
      cols="30"
      rows="5"
      bind:value={cv_faltas}
    />
    {/if}
  </div>
</div>
<div class="row">
  <div class="col-12">
    {#if cv_descripcionSituacion}
    <label for="cv_descripcionSituacion" class="fw-bold"
      >Descripción Situación</label
    >
    <!-- Utiliza bind:value para vincular el contenido del textarea con la variable cv_descripcionSituacion -->
    <textarea
      readonly
      class="form-control autoheight fst-italic"
      name="cv_descripcionSituacion"
      id="cv_descripcionSituacion"
      cols="30"
      rows="5"
      bind:value={cv_descripcionSituacion}
    />
    {/if}
  </div>
</div>
<div class="row">
  <div class="col-12 col-sm-12">
    {#if cv_descargosEstudiante}
         <!-- content here -->
    
    <label for="cv_descargosEstudiante" class="fw-bold"
      >Descargos Estudiante</label
    >
    <!-- Utiliza bind:value para vincular el contenido del textarea con la variable cv_descargosEstudiante -->
    <textarea
      class="form-control autoheight fst-italic"
      readonly
      name="cv_descargosEstudiante"
      id="cv_descargosEstudiante"
      cols="30"
      rows="5"
      bind:value={cv_descargosEstudiante}
    />
    {/if}
  </div>
  <div class="col-12 border-primary">
    {#if cv_firma}
      <!-- content here -->
      <img src={cv_firma} alt="" class="img-fluid mt-3" />
    {/if}
  </div>
</div>
<div class="row">
  {#if cv_positivos}
    <div class="col-12">
      <label for="cv_positivos" class="fw-bold">Otras Observaciones</label>
      <!-- Utiliza bind:value para vincular el contenido del textarea con la variable cv_positivos -->
      <textarea
        readonly
        class="form-control autoheight fst-italic"
        name="cv_positivos"
        id="cv_positivos"
        cols="30"
        rows="3"
        bind:value={cv_positivos}
      />
    </div>
  {/if}
</div>
