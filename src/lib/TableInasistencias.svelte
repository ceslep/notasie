<script>
	import { Button,Spinner } from 'sveltestrap';
    import moment from "moment";
    import  ChatLeftText  from "svelte-bootstrap-icons/lib/ChatLeftText";
    import MensajeAlProfesor from './MensajeAlProfesor.svelte';
    
    export let inasistenciasDetallado = undefined;
    export let openMensaje=false;
    let Inasistencia={};
    export let total=0;

    const reclamarInasistencia = async (inasistencia)=>{
        Inasistencia={...inasistencia}
        openMensaje=true;
    }

    const respuestaModal = ()=>{
        openMensaje=false;
    }

</script>

{#if openMensaje}
<MensajeAlProfesor Nota={Inasistencia} open={openMensaje} on:message={respuestaModal}/>
{/if}



    {#if inasistenciasDetallado.length>0}
    <main class="table-responsive">
    <table class="table table-striped table-hover caption-top">
        <caption><h4 class="text-success">Total Inasistencias {total}</h4></caption>
        <thead>
            <tr>
                <th>#</th>
                <th class="text-center">Fecha</th>
                <th class="text-center">Hora Clase</th>
                <th class="text-center">Excusa</th>
                <th class="text-center">Horas</th>
            </tr>
        </thead>
        <tbody>
           
            {#each inasistenciasDetallado as {fecha,hora_clase,excusa,horas},i}
            <tr>
                <td class="align-middle">{(i+1)}</td>
                <td class="align-middle">{fecha}</td>
                <td class="text-center align-middle">{hora_clase!=""?hora_clase:"Sin registro de Hora"}</td>
                <td class="text-center align-middle">{excusa!==""?excusa:"No existe excusa"}</td>
                <td class="text-center align-middle">{horas==="r"?"Retiro":horas}</td>
                    
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