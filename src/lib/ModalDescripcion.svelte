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
    import Descripcion from "./Descripcion.svelte";

    export let estudiante;
    export let asignatura;
    export let valoracion;
    export let periodo;
    export let docente;
  
   
    let descripcionDetallado = [];

    const dispatch = createEventDispatcher();

    const sendClose = (texti) => {
        console.log("close");
        dispatch("close", {
            text: texti !== "" ? texti : "",
            result: false,
        });
    };

    const getDescripcionDetallado = async () => {
        descripcionDetallado = [];
        let response = await fetch(
            "https://app.iedeoccidente.com/est/php/GetDescripcion.php",
            {
                method: "POST",
                body: JSON.stringify({
                    estudiante,
                    asignatura,
                    valoracion,
                    periodo,
                    docente
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return await response.json();
    };

    onMount(async () => {
        descripcionDetallado = await getDescripcionDetallado();
        
        
        setTimeout(() => {
            if (descripcionDetallado.length === 0) {
                sendClose("no hay Descripcion");
            }
        }, 1000);
    });
</script>

<Modal isOpen={true} scrollable fullscreen={"md"} size={"lg"}>
    <ModalHeader class="bg-info text-dark" toggle={sendClose}
        >Descripcion detallada de {asignatura}</ModalHeader
    >
    <ModalBody>
        <main>
            <h5>Período: {periodo} valoracion: <span class:perdida={parseFloat(valoracion)<3}>{valoracion!=null?valoracion:""}</span></h5>
            {#if descripcionDetallado.length > 0}
               <Descripcion
                   {descripcionDetallado}
                />
            {:else}
                <div
                    class="d-flex justify-content-center align-items-center"
                    style="min-height:50vh;"
                >
                    <Spinner size="xxl" />
                </div>
            {/if}
        </main>
    </ModalBody>
    <ModalFooter>
        <Button color="secondary" on:click={sendClose}>Cerrar</Button>
    </ModalFooter>
</Modal>

<style>
    .perdida{
        color:red;
    }
</style>