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
    import Spn from "./Spn.svelte";
    export let estudiante;
    export let data;

    const visualize=(estu)=>{
        return estu===estudiante;
    }

</script>

<main>
    {#if data.length > 0}
    <Table responsive bordered hover striped>
        <thead>
            <tr>
                <th>N°</th>
                {#each Object.keys(data[0]) as thead}
                    <th>
                        {thead}
                    </th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#each data as lista,i}
                <tr class:visualize={visualize(data[i].nombres)}>
                    <td class="align-middle text-center fs-7">{i+1}</td>
                    {#each Object.keys(lista) as key, j}
                        <td class="align-middle text-center fs-7">
                                    {lista[key]}
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
</main>

<style>
    .visualize{
        background-color: #8beb0f;
    }
    </style>