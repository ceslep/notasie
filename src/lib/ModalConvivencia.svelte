<script>
  import { createEventDispatcher, onMount } from "svelte";

  import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Spinner,
  } from "sveltestrap";
  import TarjetaConvivencia from "./TarjetaConvivencia.svelte";
  import InfoConvivencia from "./InfoConvivencia.svelte";

  export let positivo = false;

  export let info;

  const dispatch = createEventDispatcher();

  const sendClose = (texti) => {
    console.log("close");
    dispatch("close", {
      text: texti !== "" ? texti : "",
      result: false,
    });
  };

  onMount(()=>{
    console.log(info)
  });
</script>

<Modal isOpen={true} scrollable fullscreen={"md"} size={"lg"}>
  <ModalHeader
    class={positivo ? "bg-primary text-white" : "bg-danger text-yellow"}
    toggle={sendClose}
    ><span class="text-yellow">Convivencia Detallado</span>
  </ModalHeader>
  <ModalBody>
    <InfoConvivencia {...info} />
  </ModalBody>
  <ModalFooter>
    <Button color="secondary" on:click={sendClose}>Cerrar</Button>
  </ModalFooter>
</Modal>

<style>
  .text-yellow {
    color: yellow;
  }
</style>
