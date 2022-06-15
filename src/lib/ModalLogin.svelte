<script>
  import {
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Spinner,
    Table,
  } from "sveltestrap";

  import { createEventDispatcher, onMount } from "svelte";
  import Swal from "sweetalert2";
  import ListaRegistrados from "./ListaRegistrados.svelte";

  export let open = true;
  let ingresando = false;
  let listado = false;
  let listadoT = false;
  let openListado = false;
  let openListadoT = false;
  let listaRegistrados = [];
  let listaRegistradosT = [];

  let user = {
    identificacion: "",
    pass: "",
  };

  onMount(async () => {});
  const dispatch = createEventDispatcher();

  async function getDataRegister(url) {
    let response = await fetch(
      url,
      {
        method: "POST",
        body: JSON.stringify({
          estudiante: user.identificacion,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    let result = await response.json();
    return result;
  }

  async function aceptarModal() {
    ingresando = !ingresando;
    let [result, dataRegistro,dataRegistroT] = await Promise.all([
      loginFetch(),
      getDataRegister("https://app.iedeoccidente.com/est/php/getRegister.php"),
      getDataRegister("https://app.iedeoccidente.com/est/php/getRegisterT.php"),
    ]);
    ingresando = !ingresando;
    open = false;
    dispatch("message", {
      text: "Aceptar",
      result: result.acceso !== "denegado",
      data: result,
      dataRegistro: { ...dataRegistro },
      dataRegistroT: { ...dataRegistroT },
    });
  }

  function closeModal() {
    dispatch("message", {
      text: "Cancelar",
      result: false,
    });
  }

  async function loginFetch() {
    let response = await fetch(
      "https://app.iedeoccidente.com/est/php/login.php",
      {
        method: "POST",
        body: JSON.stringify(user),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    let result = await response.json();
    return result;
  }

  async function registersFetch(url) {
    let response = await fetch(
      url,
      {
        method: "POST",
        body: JSON.stringify(user),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    let result = await response.json();
    return result;
  }

  const registrarse = () => {
    dispatch("message", {
      text: "Registrarse",
      result: true,
    });
  };

  const detectRegister = async () => {
    if (user.identificacion !== "") {
      let response = await fetch(
        "https://app.iedeoccidente.com/est/php/detectRegister.php",
        {
          method: "POST",
          body: JSON.stringify({
            identificacion: user.identificacion,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      let result = await response.json();
      if (
        result.registrado === "no" &&
        !user.identificacion.includes("00000000000") &&
        !user.identificacion.includes("11111111111") &&
        !listado &&
        !listadoT


      ) {
        await Swal.fire({
          title: "No se encuentra registrado",
          text: "Por favor registrese a través de la opción Registrarse",
          icon: "info",
          confirmButtonText: "Aceptar",
        });
        user.identificacion = "";
      }
    }
  };

  const openL = async () => {
    spnlt=true;
    openListado = true;
    listaRegistrados = await registersFetch("https://app.iedeoccidente.com/est/php/GetRegisters.php");
    spnlt=false;
  };

  const openLT = async () => {
    spnlt = true;
    let listaRegistradost = await registersFetch("https://app.iedeoccidente.com/est/php/GetRegistersT.php");
    listaRegistradosT=[...listaRegistradost.map(lr=>{
      return {
         identificacion:lr.estudiante,
         nombres:lr.nombres,
         photoURL:"./estudiante1.png",
         registerat:lr.year,
      }
    }).sort((a,b)=>{if(a.nombres>b.nombres) return 1;else return -1})];
    openListadoT = true;
    spnlt = false;
  };

  $:console.log(listaRegistradosT);

  const setIdentificacion = (e) => {
    openListado = false;
    user.identificacion = e.detail.identificacion;
    user.pass = e.detail.pass;
    aceptarModal();
  };

  const setIdentificacionT = (e) => {
    openListadoT = false;
    user.identificacion = e.detail.identificacion;
    user.pass = e.detail.pass;
    aceptarModal();
  };

  $: user.identificacion.includes("0000000000")
    ? (listado = true)
    : (listado = false);

    const keypp=(e)=>{
      openListado = false;
      openListadoT = false;
      if(e.key==='F4') openL();
      if(e.key==='F2') openLT();
    }

    $: user.identificacion.includes("11111111111")
    ? (listadoT = true)
    : (listadoT = false);

    let spnlt = false;

</script>

{#if openListado}
  <ListaRegistrados
    {listaRegistrados}
    on:close={() => (openListado = false)}
    on:identificacion={setIdentificacion}
  />
{/if}

{#if openListadoT}
  <ListaRegistrados
    listaRegistrados={listaRegistradosT}
    on:close={() => (openListadoT = false)}
    on:identificacion={setIdentificacionT}
  />
{/if}

<svelte:window on:keydown={keypp} />

<Modal isOpen={open} class="anima_animated">
  <ModalHeader class="bg-primary bg-gradient text-white"
    >Iniciar Sesión</ModalHeader
  >
  <ModalBody>
    <form id="frmIngresoDocentes" autocomplete="off">
      <div class="form-group">
        <label for="docente"
          >Identificación
          {#if listado}
            <span class="text-danger me-5">
              <a href="#!" on:click={openL}>Listado</a>
            </span>
          {/if}
          {#if listadoT}
            <span class="text-danger me-5">
              <a href="#!" on:click={openLT}>Listado</a>
            </span>
          {/if}
          {#if spnlt}
          <Spinner size="sm" />
          {/if}
        </label>
        <div
          class="spinner-border spinner-border-sm d-none spseldocs"
          role="status"
        >
          <span class="visually-hidden">Loading...</span>
        </div>
        <input
          type="text"
          name="estudiante"
          inputmode="numeric"
          class="form-control"
          required
          bind:value={user.identificacion}
          on:blur={detectRegister}
          autocomplete="false"
        />
      </div>
      <div class="form-group">
        <label for="contrasena">Contraseña</label>
        <input
          type="password"
          name="password"
          id="contrasena"
          inputmode="full-width-latin"
          class="form-control"
          required
          bind:value={user.pass}
        />
      </div>
    </form>
  </ModalBody>
  <ModalFooter>
    <Button color="warning" on:click={registrarse}>Registrarse</Button>
    <Button color="secondary" on:click={closeModal}>Cancelar</Button>
    <Button
      color="primary"
      on:click={aceptarModal}
      disabled={user.identificacion === ""}
      >Ingresar
      {#if ingresando}
        <Spinner size="sm" />
      {/if}
    </Button>
  </ModalFooter>
</Modal>
<Modal />
