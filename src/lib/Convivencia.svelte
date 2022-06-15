<script>
import { Button } from "sveltestrap";
import HeartHalf from "svelte-bootstrap-icons/lib/HeartHalf";
import { createEventDispatcher } from "svelte";
   

  const dispatch = createEventDispatcher();
  
   
    export let blinking=false;
    export let positivo=false;
</script>

<main class="p-2  d-block">
   <Button  color={positivo?"primary":"danger"} class="m-0 w-100" on:click={()=>{dispatch('click')}}>
       <span class="text-yellow">Informe de Convivencia </span>
       <span class:blink_me={blinking}>
       <HeartHalf class="text-yellow" />
       {#if positivo}
       <img class="img-fluid" width="5%" src="./medalla.png" alt="Medalla">
       {/if}

    </span>
    </Button>
   
</main>

<style>
    .text-yellow{
        color: yellow;
    }

    .blink_me {
        animation: blinker 1s linear infinite;
    }

    @keyframes blinker {
        50% {
            opacity: 0;
        }
    }

  
</style>

