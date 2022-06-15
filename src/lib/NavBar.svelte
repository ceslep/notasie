<script>
  import ModalLogin from "./ModalLogin.svelte";
  import {
    Collapse,
    Navbar,
    NavbarToggler,
    NavbarBrand,
    Nav,
    NavItem,
    NavLink,
  } from "sveltestrap";

  import Swal from "sweetalert2";
  import Periodos from "./Periodos.svelte";
  import Register from "./Register.svelte";
  import { onMount } from "svelte";
  import marquee from "vanilla-marquee";

  let isOpen = false;
  let login = false;
  let dataRegistro = {};

  //Pestañas
  let periodos = false;
  let register = false;

  let nivel;
  let numero;

  let estudiante;
  let nombres;
  let periodo;
  let news;
  let block = "";

  let dataEstudiante;

  let color = "primary";
  const toggle = () => (isOpen = !isOpen);

  function openLogin() {
    toggle();
    login = true;
    block = "";
  }

  async function aceptarModal(event) {
    console.log(event.detail);
    let action = event.detail.text;
    console.log(action);
    login = false;
    if (action === "Aceptar" && event.detail.result) {
      await saveLog(event.detail.data.estudiante);
      Swal.fire({
        title: "Aceptar",
        text: `Bienvenido ${event.detail.data.estudiante.nombres}`,
        icon: "success",
      });
      nombres = event.detail.data.estudiante.nombres;
      nivel = event.detail.data.estudiante.nivel;
      numero = event.detail.data.estudiante.numero;
      periodos = true;
      dataEstudiante = event.detail.data;
      estudiante = dataEstudiante.estudiante.estudiante;
      periodo = dataEstudiante.periodo.nombre;
      dataRegistro = event.detail.dataRegistro[0];
      block = "periodos";
    } else if (action === "Aceptar" && !event.detail.result) {
      Swal.fire({
        title: "Error",
        text: "Acceso Denegado",
        icon: "error",
      });
    } else if (action === "Registrarse" && event.detail.result) {
      login = false;
      block = "register";
    }
  }

  const openRegister = () => {
    toggle();
    block = "register";
  };

  const logout = (e) => {
    block = "";
    if (e.detail.value === "registrado") login = true;
  };

  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  const getIP = async () => {
    let response = await fetch("https://api.ipify.org?format=json");
    return (await response.json()).ip;
  };

  const getGeolocation = async () => {
    let pos = "";
    if (navigator.geolocation) {
      var success = function (position) {
        var latitud = position.coords.latitude,
          longitud = position.coords.longitude;
        position = latitud + "," + longitud;
      };
      navigator.geolocation.getCurrentPosition(success, function (msg) {
        return {
          msg,
          position: "",
        };
      });
    }
  };

  async function getCoords() {
    if (navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition((position) => {
          resolve(position);
        });
      });
    }
  }

  const saveLog = async (data) => {
    let position = await getCoords();
    console.log(position);
    let response = await fetch(
      "https://app.iedeoccidente.com/est/php/saveLog.php",
      {
        method: "POST",
        body: JSON.stringify({
          estudiante:data.estudiante,
          nombres: data.nombres,
          nivel:data.nivel,
          numero:data.numero,
          movil: isMobile() ? "si" : "no",
          userAgent: navigator.userAgent,
          ip: await getIP(),
          coords: `${position.coords.latitude},${position.coords.longitude}`,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  };
  onMount(() => {
   
  });
</script>

{#if login}
  <ModalLogin open={login} on:message={aceptarModal} />
{/if}

<Navbar class="bg-success bg-gradient" dark sticky="top">
  <NavbarBrand href="https://app.iedeoccidente.com/est3" class="me-auto"
    >Académico</NavbarBrand
  >
  <NavbarToggler on:click={toggle} class="me-2" />
  <Collapse {isOpen} navbar>
    <Nav navbar>
      <NavItem>
        <NavLink href="#!" on:click={openLogin}>Iniciar Sesión</NavLink>
      </NavItem>
      <NavItem>
        <NavLink href="#!" on:click={openRegister}>Registrarse</NavLink>
      </NavItem>
    </Nav>
  </Collapse>
</Navbar>

{#if block === "periodos"}
  <Periodos dataEstudiante={dataEstudiante.estudiante} {dataRegistro} {nombres} {estudiante} {periodo} {nivel} {numero} />
{/if}

{#if block === "register"}
  <Register on:logout={logout} />
{/if}

{#if block === ""}
  <div class="d-flex justify-content-center align-items-center p-5 m-5">
    <img src="./escudo.png" alt="" class="img-fluid" />
  </div>
{/if}
