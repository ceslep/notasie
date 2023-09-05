<script>
  import { afterUpdate } from "svelte";
  import Descripcion from "./Descripcion.svelte";
  export let descripcionDetallado;
 let descript=[];
  let descriptNotas = [];
  let descriptDesc=[];
  let detal=[];

  afterUpdate(() => {
    const [desc] = descripcionDetallado;
    descript = Object.entries(desc);
    descriptNotas = [
      ...descript.filter((d) => d[0].includes("nota") && d[0].length < 6),
    ];
    descriptDesc = [
      ...descript.filter((d) => d[0].includes("aspecto")),
    ];
    console.log(descriptNotas);
    console.log(descriptDesc);
    detal=[];
    descriptNotas.forEach((d,i)=>{
        const dato={nota:d[1],descripcion:descriptDesc[i][1]};
        detal=[...detal,dato];
    });
    console.log(detal);
  });
</script>

<main class="bg-light">
  {#if descripcionDetallado.length > 0}
  <div class="table-responsive">
    <table class="table table-bordered table-striped table-hover">
        <thead>
            <tr>
                <th class="text-center align-middle">N°</th>
                <th class="text-center align-middle">Nota</th>
                <th class="text-center align-middle">Aspecto</th>
            </tr>
        </thead>
        <tbody>
            {#each detal as { nota, descripcion },index}
                <tr>
                    {#if nota}
                    <td class="text-center align-middle">
                        {index+1}
                    </td>
                    <td class="text-center align-middle">
                        {nota}
                    </td>
                    <td class="text-star align-middle">
                        {descripcion??"Sin descripción por el docente"}
                    </td>
                    {/if}
                </tr>              
            {/each}
        </tbody>

    </table>

  </div>
  {/if}
</main>
