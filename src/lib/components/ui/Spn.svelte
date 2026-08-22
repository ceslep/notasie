<script lang="ts">
  let { size = 'md' }: { size?: 'sm' | 'md' | 'lg' } = $props()
  const s = { sm: 'w-5 h-5 border-2', md: 'w-10 h-10 border-[3px]', lg: 'w-16 h-16 border-4' }
</script>
<div class="flex items-center justify-center p-8">
  <div class="{s[size]} border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
</div>
