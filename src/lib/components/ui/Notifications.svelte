<script>
  import { onMount } from 'svelte';
  import { trackNotificationOpen } from '$lib/analytics';

  let { notas = [], convivencia = [], estudiante = '' } = $props();

  let notifications = $state([]);
  let showPanel = $state(false);
  let maxVisible = 3;

  function generateNotifications() {
    const newNotifications = [];

    notas.forEach((item) => {
      if (item.valoracion < 3.0) {
        newNotifications.push({
          id: crypto.randomUUID(),
          type: 'alert',
          message: `ALERTA: ${item.asignatura} esta en riesgo con ${item.valoracion}`,
          timestamp: Date.now(),
          read: false
        });
      } else if (item.valoracion >= 4.5) {
        newNotifications.push({
          id: crypto.randomUUID(),
          type: 'success',
          message: `EXCELENTE: ${item.asignatura} con ${item.valoracion}`,
          timestamp: Date.now(),
          read: false
        });
      }
    });

    const totalAbsences = notas.reduce((acc, n) => acc + (n.inasistencias || 0), 0);
    if (totalAbsences > 5) {
      newNotifications.push({
        id: crypto.randomUUID(),
        type: 'alert',
        message: `ALERTA: Tiene ${totalAbsences} inasistencias acumuladas`,
        timestamp: Date.now(),
        read: false
      });
    }

    convivencia.forEach((item) => {
      if (item.tipoFalta) {
        newNotifications.push({
          id: crypto.randomUUID(),
          type: 'info',
          message: `CONVIVENCIA: Reporte pendiente de ${item.tipoFalta}`,
          timestamp: Date.now(),
          read: false
        });
      }
    });

    notifications = newNotifications;
  }

  function dismissNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
  }

  function markAllRead() {
    notifications = notifications.map(n => ({ ...n, read: true }));
  }

  function togglePanel() {
    showPanel = !showPanel;
    if (showPanel) {
      markAllRead();
      trackNotificationOpen(notifications.length);
    }
  }

  const unreadCount = $derived(notifications.filter(n => !n.read).length);
  const visibleNotifications = $derived(notifications.slice(0, maxVisible));

  onMount(() => {
    generateNotifications();
  });
</script>

<div class="notifications-wrapper">
  <button class="bell-button" onclick={togglePanel} aria-label="Notificaciones">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
    {#if unreadCount > 0}
      <span class="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
    {/if}
  </button>
</div>

{#if showPanel}
  <div class="notifications-panel">
    <div class="panel-header">
      <span class="panel-title">Notificaciones</span>
      <button class="close-panel" onclick={togglePanel} aria-label="Cerrar panel">✕</button>
    </div>
    <div class="panel-body">
      {#if visibleNotifications.length === 0}
        <p class="empty-message">No hay notificaciones</p>
      {/if}
    </div>
  </div>
{/if}

<div class="toast-container">
  {#each visibleNotifications as notification (notification.id)}
    {@render Toast(notification, dismissNotification)}
  {/each}
</div>

{#snippet Toast(notification, ondismiss)}
  <div class="toast-card {notification.type}">
    <div class="toast-icon">
      {#if notification.type === 'alert'}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <path d="M12 9v4"/>
          <path d="M12 17h.01"/>
        </svg>
      {:else if notification.type === 'success'}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <path d="m9 11 3 3L22 4"/>
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
      {/if}
    </div>
    <span class="toast-message">{notification.message}</span>
    <button class="toast-close" onclick={() => ondismiss(notification.id)} aria-label="Cerrar notificación">✕</button>
    <div class="toast-progress">
      <div class="toast-progress-bar" style="animation-duration: 8000ms"></div>
    </div>
  </div>
{/snippet}

<style>
  .notifications-wrapper {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
  }

  .bell-button {
    position: relative;
    background: var(--app-glass-strong-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--app-glass-strong-border);
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--app-text);
    transition: all 0.2s ease;
  }

  .bell-button:hover {
    background: color-mix(in oklab, var(--app-text) 12%, var(--app-glass-strong-bg));
    transform: scale(1.05);
  }

  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ef4444;
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 2px solid var(--app-page-bg);
  }

  .toast-container {
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 360px;
  }

  .toast-card {
    position: relative;
    background: var(--app-glass-strong-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--app-glass-strong-border);
    border-radius: 12px;
    padding: 12px 36px 12px 44px;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.3s ease forwards;
    overflow: hidden;
  }

  .toast-card.alert {
    border-left: 3px solid #f59e0b;
  }

  .toast-card.success {
    border-left: 3px solid #22c55e;
  }

  .toast-card.info {
    border-left: 3px solid #3b82f6;
  }

  .toast-icon {
    position: absolute;
    left: 12px;
    display: flex;
    align-items: center;
  }

  .toast-card.alert .toast-icon { color: #f59e0b; }
  .toast-card.success .toast-icon { color: #22c55e; }
  .toast-card.info .toast-icon { color: #3b82f6; }

  .toast-message {
    font-size: 0.82rem;
    color: var(--app-text);
    line-height: 1.4;
    flex: 1;
  }

  .toast-close {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    color: var(--app-text-secondary);
    cursor: pointer;
    font-size: 0.8rem;
    padding: 2px 4px;
    line-height: 1;
    border-radius: 4px;
    transition: color 0.15s;
  }

  .toast-close:hover {
    color: var(--app-text);
  }

  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: color-mix(in oklab, var(--app-text) 12%, transparent);
  }

  .toast-progress-bar {
    width: 100%;
    height: 100%;
    background: color-mix(in oklab, var(--app-text) 40%, transparent);
    transform-origin: left;
    animation: shrink linear forwards;
  }

  .toast-card.alert .toast-progress-bar { background: #f59e0b; }
  .toast-card.success .toast-progress-bar { background: #22c55e; }
  .toast-card.info .toast-progress-bar { background: #3b82f6; }

  .notifications-panel {
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 1001;
    width: 340px;
    max-height: 400px;
    background: var(--app-glass-strong-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--app-glass-strong-border);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: fadeIn 0.2s ease;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid color-mix(in oklab, var(--app-text) 10%, transparent);
  }

  .panel-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--app-text);
  }

  .close-panel {
    background: none;
    border: none;
    color: var(--app-text-secondary);
    cursor: pointer;
    font-size: 0.9rem;
    padding: 2px 6px;
    border-radius: 4px;
    transition: color 0.15s;
  }

  .close-panel:hover {
    color: var(--app-text);
  }

  .panel-body {
    padding: 12px;
    overflow-y: auto;
    flex: 1;
  }

  .empty-message {
    text-align: center;
    color: #64748b;
    font-size: 0.85rem;
    padding: 20px 0;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(40px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes shrink {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
