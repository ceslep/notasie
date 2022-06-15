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

    export let datosConvivencia = [];
    export let positivo=false;

    const dispatch = createEventDispatcher();

    const sendClose = (texti) => {
        console.log("close");
        dispatch("close", {
            text: texti !== "" ? texti : "",
            result: false,
        });
    };
</script>

<Modal isOpen={true} scrollable fullscreen={"md"} size={"lg"}>
    <ModalHeader class={positivo?"bg-primary text-white":"bg-danger text-yellow"} toggle={sendClose}
        ><span class="text-yellow">Convivencia Detallado</span>
    </ModalHeader>
    <ModalBody>
        <main>
            {#each datosConvivencia as convivencia}
                <TarjetaConvivencia {...convivencia} />
            {/each}
        </main>
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
