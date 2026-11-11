import './app.css'
import { mount } from 'svelte'
import App from './App.svelte'
import { initAnalytics } from '$lib/analytics'
import { initTheme } from '$lib/theme.svelte'

initTheme()
initAnalytics()

const app = mount(App, { target: document.getElementById('app')! })

export default app
