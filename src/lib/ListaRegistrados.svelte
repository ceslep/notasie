<script>
    import {
        Button,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        Spinner,
        Image,
        Table,
    } from "sveltestrap";

    import { createEventDispatcher, onMount } from "svelte";
    import Swal from "sweetalert2";
    import Spn from "./Spn.svelte";

    export let listaRegistrados = [];

    const dispatch = createEventDispatcher();

    const closeModal = () => {
        dispatch("close");
    };
</script>

<Modal
    isOpen={true}
    class="anima_animated"
    fullscreen={"md"}
    size={"lg"}
    centered={true}
    scrollable
>
    <ModalHeader class="bg-success text-dark  bg-gradient bg-opacity-50"
        >Lista de Registrados</ModalHeader
    >
    <ModalBody class="">
        {#if listaRegistrados.length > 0}
            <Table responsive bordered hover striped>
                <thead>
                    <tr>
                        <th>N°</th>
                        {#each Object.keys(listaRegistrados[0]) as thead}
                            <th>
                                {thead}
                            </th>
                        {/each}
                    </tr>
                </thead>
                <tbody>
                    {#each listaRegistrados as lista, i}
                        <tr>
                            <td class="align-middle text-center fs-7"
                                >{i + 1}</td
                            >
                            {#each Object.keys(lista) as key, j}
                                <td class="align-middle text-center fs-7">
                                    {#if key !== "photoURL"}
                                        {#if key === "identificacion"}
                                            <a
                                                href="#!"
                                                on:click={() =>
                                                    dispatch("identificacion", {
                                                        identificacion:
                                                            lista[key],
                                                        pass: lista[key],
                                                    })}>{lista[key]}</a
                                            >
                                        {:else}
                                            {lista[key]}
                                        {/if}
                                    {:else}
                                        <img
                                            loading="lazy"
                                            class="img-fluid mx-auto"
                                            src={lista[key]}
                                            alt="foto"
                                            on:error={function () {
                                                this.src = "./estudiante.png";
                                                this.width = "60";
                                            }}
                                        />
                                    {/if}
                                </td>
                            {/each}
                        </tr>
                    {/each}
                </tbody>
            </Table>
        {:else}
            <div class="d-flex justify-content-center align-items-center">
                <Spn />
            </div>
        {/if}
    </ModalBody>
    <ModalFooter>
        <Button color="secondary" on:click={closeModal}>Cerrar</Button>
    </ModalFooter>
</Modal>
<Modal />

<style>
    .fs-7 {
        font-size: 0.85rem;
    }
</style>
