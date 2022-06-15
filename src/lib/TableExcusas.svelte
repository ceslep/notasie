<script>
	import { Button,Spinner } from 'sveltestrap';
    import moment from "moment";
    import  ChatLeftText  from "svelte-bootstrap-icons/lib/ChatLeftText";
    import MensajeAlProfesor from './MensajeAlProfesor.svelte';
    
    export let ExcusasDetallado = undefined;
    export let openMensaje=false;
    let Excusas={};
    export let total=0;

    const reclamarExcusas = async (Excusas)=>{
        Excusas={...Excusas}
        openMensaje=true;
    }

    const respuestaModal = ()=>{
        openMensaje=false;
    }

</script>

{#if openMensaje}
<MensajeAlProfesor Nota={Excusas} open={openMensaje} on:message={respuestaModal}/>
{/if}



    {#if ExcusasDetallado.length>0}
    <main class="table-responsive">
    <table class="table table-striped table-hover caption-top">
        <caption><h4 class="text-success">Total Excusas {total}</h4></caption>
        <thead>
            <tr>
                <th>#</th>
                <th class="text-center">Fecha</th>
                <th class="text-center">Motivo</th>
                <th class="text-center">Permiso</th>
                <th class="text-center">Período</th>
            </tr>
        </thead>
        <tbody>
           
            {#each ExcusasDetallado as {fecha,motivo,motivo_permiso,periodo},i}
            <tr>
                <td class="align-middle">{(i+1)}</td>
                <td class="align-middle">{fecha}</td>
                <td class="text-center align-middle">{motivo!=""?motivo:"No hay motivo"}</td>
                <td class="text-center align-middle">{motivo_permiso!==""?motivo_permiso:"No existe excusa"}</td>
                <td class="text-center align-middle">{periodo}</td>
                    
            </tr>
            {/each}
            
        </tbody>
    </table>
</main>
    {:else}
            <div class="d-flex justify-content-center align-items-center vh-75">
                <Spinner size="xxl" class="text-center"/>
                </div>
            {/if}



<style>
 
</style>