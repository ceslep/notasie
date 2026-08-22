<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { mapApi } from '$lib/services/api'
  import Spn from '../ui/Spn.svelte'

  let { onClose }: { onClose?: () => void } = $props()
  let mapEl: HTMLDivElement
  let L: any
  let map: any

  onMount(() => {
    const load = async () => {
      const d = await mapApi.getDataMap()
      L = await import('leaflet')

      map = L.map(mapEl, { zoomControl: false }).setView([4.24195, -75.965519], 14)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map)

      L.control.zoom({ position: 'bottomleft' }).addTo(map)

      L.control.locate({ setView: 'once', locateOptions: { enableHighAccuracy: true } }).addTo(map)

      for (const dt of d) {
        if (dt.lat !== '0' && dt.lon !== '0') {
          L.marker([parseFloat(dt.lat), parseFloat(dt.lon)])
            .bindPopup(`<div class='text-xs'>${dt.Nombres} - ${dt.clase} - ${dt.asignatura}</div>`)
            .addTo(map)
        }
      }
    }
    load()

    return () => { if (map) map.remove() }
  })
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick={() => onClose?.()}></div>
  <div class="relative glass-strong w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10">
  <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-t-3xl flex items-center justify-between">
    <h3 class="text-base font-bold">Mapa</h3>
    <button class="text-slate-400 hover:text-white text-lg transition-colors" onclick={() => { onClose?.() }}>x</button>
  </div>
  <div class="relative">
    <div bind:this={mapEl} class="h-[60vh]"></div>
    <div class="absolute bottom-16 right-4 z-50">
      <div class="bg-white rounded-full shadow-lg p-2">
        <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
    </div>
  </div>
  <div class="px-5 pb-5 pt-3"><button class="w-full rounded-2xl px-4 py-3 text-sm font-semibold glass text-slate-300 hover:text-white active:scale-[0.98] transition-transform" onclick={() => { onClose?.() }}>Cerrar</button></div>
</div></div>


