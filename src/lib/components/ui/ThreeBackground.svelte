<script lang="ts">
  import { onMount, onDestroy } from 'svelte'

  let canvas: HTMLCanvasElement
  let animId: number

  onMount(() => {
    const init = async () => {
      const THREE = await import('three')

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      camera.position.z = 30

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      const particles: any[] = []
      const geometries = [
        new THREE.IcosahedronGeometry(0.4, 0),
        new THREE.OctahedronGeometry(0.35, 0),
        new THREE.TetrahedronGeometry(0.3, 0),
        new THREE.SphereGeometry(0.25, 8, 8),
      ]

      const colors = [0x6366f1, 0xa855f7, 0xec4899, 0x818cf8, 0xc084fc, 0xf472b6, 0x10b981, 0x3b82f6]

      for (let i = 0; i < 60; i++) {
        const geo = geometries[Math.floor(Math.random() * geometries.length)]
        const mat = new THREE.MeshPhongMaterial({
          color: colors[Math.floor(Math.random() * colors.length)],
          transparent: true,
          opacity: 0.6 + Math.random() * 0.3,
          shininess: 100,
          emissive: colors[Math.floor(Math.random() * colors.length)],
          emissiveIntensity: 0.15,
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 30
        )
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
        const s = 0.5 + Math.random() * 1.5
        mesh.scale.set(s, s, s)
        mesh.userData = {
          rotSpeed: { x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02 },
          floatSpeed: 0.0005 + Math.random() * 0.001,
          floatOffset: Math.random() * Math.PI * 2,
          baseY: mesh.position.y,
        }
        scene.add(mesh)
        particles.push(mesh)
      }

      const ambientLight = new THREE.AmbientLight(0x404060, 0.5)
      scene.add(ambientLight)

      const dirLight = new THREE.DirectionalLight(0x818cf8, 1.2)
      dirLight.position.set(10, 10, 10)
      scene.add(dirLight)

      const pointLight1 = new THREE.PointLight(0xec4899, 1.5, 50)
      pointLight1.position.set(-15, 10, 5)
      scene.add(pointLight1)

      const pointLight2 = new THREE.PointLight(0x6366f1, 1.5, 50)
      pointLight2.position.set(15, -10, 5)
      scene.add(pointLight2)

      let mouseX = 0
      let mouseY = 0
      const onMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1
      }
      window.addEventListener('mousemove', onMouseMove)

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', onResize)

      let time = 0
      const animate = () => {
        animId = requestAnimationFrame(animate)
        time += 0.01

        camera.position.x += (mouseX * 3 - camera.position.x) * 0.02
        camera.position.y += (mouseY * 2 - camera.position.y) * 0.02
        camera.lookAt(0, 0, 0)

        particles.forEach((p) => {
          p.rotation.x += p.userData.rotSpeed.x
          p.rotation.y += p.userData.rotSpeed.y
          p.position.y = p.userData.baseY + Math.sin(time * p.userData.floatSpeed * 100 + p.userData.floatOffset) * 1.5
        })

        pointLight1.position.x = Math.sin(time * 0.5) * 20
        pointLight1.position.y = Math.cos(time * 0.3) * 15
        pointLight2.position.x = Math.cos(time * 0.4) * 20
        pointLight2.position.y = Math.sin(time * 0.6) * 15

        renderer.render(scene, camera)
      }
      animate()
    }
    init()
  })

  onDestroy(() => {
    if (animId) cancelAnimationFrame(animId)
  })
</script>

<canvas bind:this={canvas} class="fixed inset-0 w-full h-full pointer-events-none" style="z-index: 0;"></canvas>
