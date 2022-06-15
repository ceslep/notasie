<script>

    import {  createEventDispatcher, onMount } from "svelte";

    import {
        Modal,
        ModalHeader,
        ModalBody,
        ModalFooter,
        Button,
        Spinner,
    } from "sveltestrap";
    import TableInasistencias from "./TableInasistencias.svelte";

    export let estudiante;
    export let asignatura;
    export let periodo;

    

    let inasistencias = {};
    let inasistenciasDetallado=[];


    const dispatch = createEventDispatcher();

    const sendClose = () =>{
       console.log("close");
        dispatch("close", {
            text: "close",
            result: false,
        });
    }

    const getInasistenciasDetallado = async () => {
        let response = await fetch(
            "https://app.iedeoccidente.com/est/php/GetInasistencias.php",
            {
                method: "POST",
                body: JSON.stringify({
                    estudiante,
                    asignatura,
                    periodo,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return await response.json();
    };

    

    onMount(async () => {
       
        inasistencias = await getInasistenciasDetallado();
        inasistenciasDetallado = inasistencias.inasistencias;
      
      
    });
   
   
</script>

<Modal isOpen={true} scrollable fullscreen={"md"} size={"lg"}>
    <ModalHeader class="bg-warning text-dark"  >Inasistencias Detallado</ModalHeader>
    <ModalBody>
        <main>
            {#if inasistenciasDetallado}
                <TableInasistencias {inasistenciasDetallado} />
            {:else}
                <div class="d-flex justify-content-center align-items-center" style="min-height:50vh;">
                    <Spinner size="xxl" />
                </div>
            {/if}
        </main>
    </ModalBody>
    <ModalFooter>
        <Button color="secondary" on:click={()=>{}}>Cerrar</Button>
    </ModalFooter>
</Modal>
