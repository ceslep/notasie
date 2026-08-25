<script lang="ts">
  let { photoURL, children, onClose }: {
    photoURL: string; children?: any; onClose?: () => void
  } = $props()
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" role="button" tabindex="-1" onclick={() => onClose?.()} onkeydown={(e) => e.key === 'Escape' && onClose?.()}></div>
  <div class="relative glass-strong w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden z-10">
  <div class="bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-white px-5 py-3 rounded-t-3xl flex items-center justify-between">
    <h3 class="text-base font-bold">Foto</h3>
    <button class="text-slate-400 hover:text-white text-lg transition-colors" onclick={() => onClose?.()}>x</button>
  </div>
  <div class="p-5 flex flex-col items-center gap-3">
    <img class="w-2/3 h-auto rounded-2xl object-cover shadow-lg" alt="" src={photoURL} />
    {#if children}{@render children()}{/if}
  </div>
  <div class="px-5 pb-5"><button class="w-full rounded-2xl px-4 py-3 text-sm font-semibold glass text-slate-300 hover:text-white active:scale-[0.98] transition-transform" onclick={() => onClose?.()}>Cerrar</button></div>
</div></div>


