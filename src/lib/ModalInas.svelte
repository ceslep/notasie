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

    export let total=0;

    let inasistencias = {};
    let inasistenciasDetallado=[];


    const dispatch = createEventDispatcher();

    const sendClose = (texti) =>{
       console.log("close");
        dispatch("close", {
            text: texti!==""?texti:"",
            result: false,
        });
    }

    const getInasistenciasDetallado = async () => {
        inasistenciasDetallado=[];
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
       
        inasistenciasDetallado = await getInasistenciasDetallado();
        //inasistenciasDetallado = inasistencias.inasistencias;
        total = inasistenciasDetallado.filter(i=>!isNaN(parseInt(i.horas))).reduce((a,b)=>a+parseInt(b.horas),0);
        setTimeout(() => {
            if (inasistenciasDetallado.length === 0) {
                sendClose('no hay inasistencias');
            }
        }, 1000);
        
      
      
    });
   
   
</script>

<Modal isOpen={true} scrollable fullscreen={"md"} size={"lg"}>
    <ModalHeader class="bg-info text-dark" toggle={sendClose} >Inasistencias Detallado {asignatura}</ModalHeader>
    <ModalBody>
        <main>
            {#if inasistenciasDetallado.length>0}
                <TableInasistencias {total} {inasistenciasDetallado} />
            {:else}
                <div class="d-flex justify-content-center align-items-center" style="min-height:50vh;">
                    <Spinner size="xxl" />
                </div>
            {/if}
        </main>
    </ModalBody>
    <ModalFooter>
        <Button color="secondary" on:click={sendClose}>Cerrar</Button>
    </ModalFooter>
</Modal>
