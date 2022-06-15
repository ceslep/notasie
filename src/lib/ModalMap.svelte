<script>
	import { createEventDispatcher, onMount } from "svelte";

	
	import L from "leaflet";
	import MapToolbar from "./MapUtils/MapToolbar.svelte";
	import MarkerPopup from "./MapUtils/MarkerPopup.svelte";
	import * as markerIcons from "./MapUtils/markers.js";

	let map;
	export let markerLocations = [
		
	];

	const dispatch = createEventDispatcher();

	const sendClose = () => {
		console.log("close");
		dispatch("close");
	};

	onMount(async () => {
		
		
	});

	const initialView = [5.233418539738852, -75.78562503027509];

	function createMap(container) {
		let m = L.map(container, { preferCanvas: true }).setView(
			initialView,15,
		);
		L.tileLayer(
			"https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
			{
				attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,
	        &copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`,
				subdomains: "abcd",
				maxZoom: 35,
			}
		).addTo(m);

		return m;
	}

	let eye = true;
	let lines = true;

	let toolbar = L.control({ position: "topright" });
	let toolbarComponent;
	toolbar.onAdd = (map) => {
		let div = L.DomUtil.create("div");
		toolbarComponent = new MapToolbar({
			target: div,
			props: {},
		});

		toolbarComponent.$on("click-eye", ({ detail }) => (eye = detail));
		toolbarComponent.$on("click-lines", ({ detail }) => (lines = detail));
		toolbarComponent.$on("click-reset", () => {
			map.setView(initialView, 15, { animate: true });
		});

		return div;
	};

	toolbar.onRemove = () => {
		if (toolbarComponent) {
			toolbarComponent.$destroy();
			toolbarComponent = null;
		}
	};

	// Create a popup with a Svelte component inside it and handle removal when the popup is torn down.
	// `createFn` will be called whenever the popup is being created, and should create and return the component.
	function bindPopup(marker, createFn) {
		let popupComponent;
		marker.bindPopup(() => {
			let container = L.DomUtil.create("div");
			popupComponent = createFn(container);
			return container;
		});

		marker.on("popupopen", (l) => {
		
			
		});

		marker.on("popupclose", () => {
			if (popupComponent) {
				let old = popupComponent;
				popupComponent = null;
				// Wait to destroy until after the fadeout completes.
				setTimeout(() => {
					old.$destroy();
				}, 500);
			}
		});
	}

	let markers = new Map();

	function markerIcon(count) {
		let html = `<div class="map-marker" style="color:rgb(${Math.floor(255*Math.random())},${Math.floor(255*Math.random())},${Math.floor(255*Math.random())});'"><div>${markerIcons.library}</div><div class="marker-text">${""}</div></div>`;
		return L.divIcon({
			html,
			className: "map-marker",
		});
	}

	function createMarker(loc) {
		console.log(loc);
		let location=String(loc);
		let ls=location.split(",");
		let Loc=[parseFloat(ls[0]),parseFloat(ls[1])];
		console.log(location);
		console.log(Loc);
		let count = Math.ceil(Math.random() * 25);
		let icon = markerIcon(count);
		let marker = L.marker(Loc, { icon });
		bindPopup(marker, (m) => {
			let c = new MarkerPopup({
				target: m,
				props: {
					
					info:`${location.split(",")[2]}, ${location.split(",")[1]}`,
					estudiante:location.split(",")[2],
					nombres:location.split(",")[3],
					nivel:location.split(",")[4],
					numero:location.split(",")[5],
				},
			});

			c.$on("change", ({ detail }) => {
				count = detail;
				marker.setIcon(markerIcon(count));
			});

			return c;
		});

		return marker;
	}

	function createLines() {
		return L.polyline(markerLocations, { color: "#E4E", opacity: 0.5 });
	}

	let markerLayers;
	let lineLayers;
	function mapAction(container) {
		map = createMap(container);
		toolbar.addTo(map);

		markerLayers = L.layerGroup();
		for (let location of markerLocations) {
		//	console.log(location);
			let m = createMarker(location);
			markerLayers.addLayer(m);
		}

	//	lineLayers = createLines();

		markerLayers.addTo(map);
	//	lineLayers.addTo(map);

		return {
			destroy: () => {
				toolbar.remove();
				map.remove();
				map = null;
			},
		};
		window.scrollTo(0, 0);
	}

	// We could do these in the toolbar's click handler but this is an example
	// of modifying the map with reactive syntax.
	$: if (markerLayers && map) {
		if (eye) {
			markerLayers.addTo(map);
		} else {
			markerLayers.remove();
		}
	}

	$: if (lineLayers && map) {
		if (lines) {
			lineLayers.addTo(map);
		} else {
			lineLayers.remove();
		}
	}

	function resizeMap() {
		
		if (map) {
			map.invalidateSize();
		}
	}

	let y=-100;
	let ct;
	
</script>

<svelte:window on:resize={resizeMap} bind:scrollY={y} />
<div class="container mt-50">

<a
	class="btn btn-primary btn-sm text-decoration-none float-end"
	href="#!/"
	on:click={() => dispatch("close")}>X</a
>
<link
	rel="stylesheet"
	href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
	integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
	crossorigin=""
/>
<div class="map mt-5 vw-75 vh-100 mx-auto" use:mapAction />
</div>

<!--
<Modal isOpen={true} scrollable fullscreen size={"xl"}>
    <ModalHeader class="bg-info text-dark" toggle={sendClose} >Mapa</ModalHeader>
    <ModalBody>
        <main>
           
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
               integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
               crossorigin=""/>
            <div class="map" style="height:100%;width:100%" use:mapAction />
        </main>
    </ModalBody>
    <ModalFooter>
        <Button color="secondary" on:click={sendClose}>Cerrar</Button>
    </ModalFooter>
</Modal>
-->
<style>
	.map :global(.marker-text) {
		
		text-align: center;
		font-weight: 600;
		background-color: #444;
		color: yellow;
		border-radius: 0.5rem;
	}

	.map :global(.map-marker) {
		width: 20px;
		transform: translateX(-50%) translateY(-25%);
		
	}

	.mt-50{
		margin-top: 50px;
	
	}

	
</style>
