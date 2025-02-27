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
    import TableNotas from "./TableNotas.svelte";

    export let estudiante;
    export let asignatura;
    export let periodo;

    export let open=true;

    let notasDetallado = [];
    let notasDetalladoFull=[];

    const dispatch = createEventDispatcher();

    const sendClose = (texti) =>
        dispatch("close", {
            text: texti!==""?texti:"",
            result: false,
        });

    export const getNotasDetallado = async (asignat,period) => {
       
        let response = await fetch(
            "https://app.iedeoccidente.com/est/php/GetNotasDetallado.php",
            {
                method: "POST",
                body: JSON.stringify({
                    estudiante,
                    asignatura:asignat,
                    periodo:period,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return await response.json();
    };

    

    onMount(async () => {
       
        notasDetallado = await getNotasDetallado(asignatura,periodo);
        notasDetalladoFull=[...notasDetallado];
        notasDetallado=notasDetallado.filter(nota=>nota.Nota!==null);
        setTimeout(() => {
            if (notasDetallado.length === 0) {
                sendClose('no hay notas');
            }
        }, 1000);
      
       
    });
   
    const toggle = () => (open = !open);
</script>

<Modal isOpen={true} scrollable fullscreen={"md"} size={"lg"}>
    <ModalHeader class="bg-warning text-dark" toggle={sendClose}  >Notas Detallado {asignatura}</ModalHeader>
    <ModalBody>
        <main>
            {#if notasDetallado.length > 0}
                <TableNotas {notasDetallado} {notasDetalladoFull}/>
            {:else}
                <div class="d-flex justify-content-center align-items-center" style="min-height:50vh;">
                    <Spinner size="xxl" />
                </div>
            {/if}
        </main>
    </ModalBody>
    <ModalFooter>
        <Button color="secondary" on:click={()=>{sendClose('')}}>Cerrar</Button>
    </ModalFooter>
</Modal>
