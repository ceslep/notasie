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
import Swal from "sweetalert2";
    import TableExcusas from "./TableExcusas.svelte";

    export let estudiante;
    export let periodo;
  

    export let total = 0;

    let Excusas = {};
    let ExcusasDetallado = [];

    const dispatch = createEventDispatcher();

    const sendClose = (texti) => {
        console.log("close");
        dispatch("close", {
            text: texti !== "" ? texti : "",
            result: false,
        });
    };

    const getExcusasDetallado = async () => {
        ExcusasDetallado = [];
        try{
        let response = await fetch(
            "https://app.iedeoccidente.com/est/php/GetExcusas.php",
            {
                method: "POST",
                body: JSON.stringify({
                    estudiante,
                    periodo
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return await response.json();
        }catch(e){
            console.error(e);
            await Swal.fire({
                icon:"error",
                text:"No hay conexión a internet",
                toast:true
            });
        }
        sendClose("");
    };

    onMount(async () => {
        Excusas = await getExcusasDetallado();
        ExcusasDetallado = Excusas.excusas;
        total = Excusas.total;
        setTimeout(() => {
            if (ExcusasDetallado.length === 0) {
                sendClose("no hay excusas");
            }
        }, 1000);
    });
</script>

<Modal isOpen={true} scrollable fullscreen={"md"} size={"lg"}>
    <ModalHeader class="bg-info text-dark" toggle={sendClose}
        >Excusas Detallado</ModalHeader
    >
    <ModalBody>
        <main>
            {#if ExcusasDetallado.length > 0}
                <TableExcusas {total} {ExcusasDetallado} />
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
