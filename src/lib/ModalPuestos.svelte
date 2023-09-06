<script>
    import { afterUpdate, createEventDispatcher } from "svelte";
    import { TabContent, TabPane } from "sveltestrap";

    import {
        Modal,
        ModalHeader,
        ModalBody,
        ModalFooter,
        Button,
    } from "sveltestrap";
    import GraficasPuestos from "./GraficasPuestos.svelte";
    import TablePuestos from "./TablePuestos.svelte";

    const dispatch = createEventDispatcher();

    const sendClose = (texti) => {
        console.log("close");
        dispatch("close", {
            text: texti !== "" ? texti : "",
            result: false,
        });
    };
    export let estudiante;
    export let periodo;
    export let nombres;
    export let puestosIe = [];
    export let puestosGrupo = [];
    export let puestosPeriodos = [];

    afterUpdate(()=>{
       
        console.log(puestosIe);
    })
    let pgrupo;
    let pie;
    $: if (puestosGrupo.length > 0) {
        pgrupo = puestosGrupo.findIndex((p) => p.nombres == nombres) + 1;
    }
    $: if (puestosIe.length > 0) {
        console.log(estudiante)
        pie = puestosIe.findIndex((p) => p.nombres == nombres) + 1;
    }

    let dataC = [];
    let dataC2 = [];
    let dataLabels = [];
    let dataLabels2 = [];

    async function tabChange(e) {
        console.log(e)
        if (e.detail === "grp") {
            let datac = [];
            let datac2 = [];
            let datalabels = [];
            let datalabels2 = [];
            let maxie = Math.max(
                ...puestosPeriodos.map((p) => p.data.ie.length)
            );
            let maxgrupo = Math.max(
                ...puestosPeriodos.map((p) => p.data.grupo.length)
            );
            puestosPeriodos
                .map((p) => {
                    return {
                        ...p,
                        orden:
                            p.periodo === "UNO"
                                ? 1
                                : p.periodo === "DOS"
                                ? 2
                                : p.periodo === "TRES"
                                ? 3
                                : p.periodo === "CUATRO"
                                ? 4
                                : 5,
                    };
                })
                .sort((a, b) => a.orden - b.orden)
                .forEach((periodo) => {
                    let dataPuesto =
                        periodo.data.ie.findIndex(
                            (p) => p.nombres === estudiante
                        ) + 1;
                    let dataPuestoGrupo =
                        periodo.data.grupo.findIndex(
                            (p) => p.nombres === estudiante
                        ) + 1;
                    dataPuesto = dataPuesto === 0 ? maxie : dataPuesto;
                    dataPuestoGrupo =
                        dataPuestoGrupo === 0 ? maxgrupo : dataPuestoGrupo;
                    datac.push(dataPuesto);
                    datac2.push(dataPuestoGrupo);
                    datalabels.push(periodo.periodo);
                    datalabels2.push(periodo.periodo);
                });

            dataC = [...datac];
            dataC2 = [...datac2];
            dataLabels = [...datalabels];
            dataLabels2 = [...datalabels2];

            console.log(dataC);
            console.log(dataC2);
            console.log(dataLabels);
            console.log(dataLabels2);
        }
    }
</script>

<Modal isOpen={true} scrollable fullscreen={"md"} size={"lg"}>
    <ModalHeader class="bg-warning text-danger" toggle={sendClose}
        ><span class="text-yellow">Puestos</span>
    </ModalHeader>
    <ModalBody>
        <main>
            <!-- <TabContent on:tab={tabChange}>
                <TabPane tabId="alpha" tab="Ie" active>
                    <h2>Puestos I.E. Período {periodo}</h2>
                    <p class="font-weight-bold text-success">
                        Puesto en la institución = {pie}
                    </p>
                    <TablePuestos {estudiante} data={puestosIe} />
                </TabPane>
                <TabPane tabId="bravo" tab="Grupo">
                    <h2>Puestos Grupo Período {periodo}</h2>
                    <p class="font-weight-bold text-success">
                        Puesto en el Grupo = {pgrupo}
                    </p>
                    <TablePuestos {estudiante} data={puestosGrupo} />
                </TabPane>
                <TabPane tabId="grp" tab="Gráficas">
                    <h2>Período {periodo}</h2>
                    <GraficasPuestos
                        {dataC}
                        {dataC2}
                        {dataLabels}
                        {dataLabels2}
                        Label={"Puesto"}
                    />
                </TabPane>
            </TabContent> -->
            <TabContent>
                <TabPane tabId="alpha" tab="Institución Educativa" active>
                    <h2>Puestos I.E. Período {periodo}</h2>
                    <p class="font-weight-bold text-success">
                        Puesto en la institución = {pie}
                    </p>
                    <TablePuestos estudiante={nombres} data={puestosIe} />
                </TabPane>
                <TabPane tabId="bravo" tab="Grupo">
                    <h2>Puestos Grupo Período {periodo}</h2>
                    <p class="font-weight-bold text-success">
                        Puesto en el Grupo = {pgrupo}
                    </p>
                    <TablePuestos estudiante={nombres} data={puestosGrupo} />
                </TabPane>
               
              </TabContent>
        </main>
    </ModalBody>
    <ModalFooter>
        <Button color="secondary" on:click={sendClose}>Cerrar</Button>
    </ModalFooter>
</Modal>

<style>
    .text-yellow {
        color: yellow;
    }
</style>
