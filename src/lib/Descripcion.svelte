<script>
    import Descripcion from "./Descripcion.svelte";
    export let descripcionDetallado;
</script>

<main class="bg-light">
    {#if descripcionDetallado.length > 0}
        {#each descripcionDetallado as { desempeno, descripcion }}
            <h4 class="text-success text-justify">Desempeño :{desempeno}</h4>
            <h5>
                <p class="text-secondary text-justify">
                    {descripcion}
                </p>
            </h5>
        {/each}
    {/if}
</main>
