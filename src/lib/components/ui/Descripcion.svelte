<script lang="ts">
  let { descripcionDetallado }: { descripcionDetallado: any[] } = $props()

  let detal = $derived.by(() => {
    if (descripcionDetallado.length > 0) {
      const [desc] = descripcionDetallado
      const descript = Object.entries(desc)
      const descriptNotas = descript.filter((d: any) => d[0].includes('nota') && d[0].length < 6)
      const descriptDesc = descript.filter((d: any) => d[0].includes('aspecto'))
      return descriptNotas.map((d: any, i: number) => ({
        nota: d[1] as string,
        descripcion: (descriptDesc[i]?.[1] as string) ?? '',
      }))
    }
    return []
  })
</script>
{#if descripcionDetallado.length > 0}
  <div class="overflow-x-auto rounded-xl border border-white/5">
    <table class="w-full text-sm">
      <thead><tr class="bg-white/5 border-b border-white/5">
        <th class="px-3 py-2 text-center font-semibold text-slate-400 text-xs">N</th>
        <th class="px-3 py-2 text-center font-semibold text-slate-400 text-xs">Nota</th>
        <th class="px-3 py-2 text-center font-semibold text-slate-400 text-xs">Aspecto</th>
      </tr></thead>
      <tbody>
        {#each detal as { nota, descripcion }, index}
          {#if nota}
            <tr class="border-b border-white/5">
              <td class="px-3 py-2 text-center">{index + 1}</td>
              <td class="px-3 py-2 text-center font-medium">{nota}</td>
              <td class="px-3 py-2 text-slate-400">{descripcion || 'Sin descripcion'}</td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
{/if}

