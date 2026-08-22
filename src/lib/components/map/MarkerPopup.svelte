<script lang="ts">
  let { info = '', estudiante, nombres, nivel, numero }: {
    info?: string; estudiante: string; nombres: string; nivel: string; numero: string
  } = $props()
</script>
<div class="text-xs p-1">
  <div class="text-red-600 font-medium">{info} {estudiante}</div>
  <div class="text-emerald-600 font-semibold">{nombres}</div>
  <div class="text-blue-600">{nivel}-{numero}</div>
</div>
