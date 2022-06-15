<script>
    import {
        Button,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        Spinner,
        Alert,
        Row,
        Col,
        Input,
        Label,
    } from "sveltestrap";
    import "animate.css";

    import { createEventDispatcher, onMount } from "svelte";
    import Swal from "sweetalert2";

    export let open = true;
    export let Nota = {};
    let observacion = "";
    let form;

    let ingresando = false;

    let reclamo = {
        estudiante: "",
        profesor: "",
        asignatura: "",
        fecha: "",
        aspecto: "",
        nota: "",
        observacion: "",
    };
    const dispatch = createEventDispatcher();

    async function enviar() {
        if (reclamo.observacion.length < 50) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "La observación debe tener al menos 50 caracteres",
            });
            return;
        }
        let response = await fetch("https://app.iedeoccidente.com/est/php/GuardarReclamo.php", {
            method: "POST",
            body: JSON.stringify(reclamo),
            headers: {
                "Content-Type": "application/json",
            },
        });
        let data = await response.json();
        if (data.mensaje==="ok") {
           await  Swal.fire({
                icon: "success",
                title: "Excelente",
                text: "Su reclamo ha sido enviado",
            });
        } else {
            await Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Ha ocurrido un error",
            });
        }
        open = false;
        dispatch("message", {
            text: "Aceptar",
        });
        
       
    }

    function closeModal() {
        dispatch("message", {
            text: "Cancelar",
            result: false,
        });
    }

    $: reclamo.estudiante = Nota.Estudiante;
    $: reclamo.profesor = Nota.Docenteid;
    $: reclamo.asignatura = Nota.Asignatura;
    $: reclamo.fecha = new Date().toISOString().slice(0, 10);
    $: reclamo.aspecto = Nota.Aspecto;
    $: reclamo.nota = Nota.Nota;
    $: reclamo.observacion = observacion;
    $: console.log(reclamo);
</script>

<Modal
    isOpen={open}
    contentClassName="anima_animated animate__headShake"
    centered={true}
    fade={false}
>
    <ModalHeader class="bg-primary text-white" toggle={closeModal}
        >Mensaje al Profesor</ModalHeader
    >
    <ModalBody>
        <form id="frmReclamoNota" bind:this={form}>
            <input type="hidden" name="estudiante" bind:value={reclamo.estudiante}>
            <Alert color="secondary" fade={false}>
                <h4 class="alert-heading text-capitalize">Descripción</h4>
                <div class="w-100">
                    <Row>
                        <Col sm="3">
                            <span class="fw-bold">Aspecto</span>
                        </Col>
                        <Col sm="9">
                            : {Nota.Aspecto !== null
                                ? `${Nota.Aspecto} (${Nota.FechaAspecto})`
                                : "No hay aspecto registrado"}
                        </Col>
                    </Row>
                    <Row>
                        <Col sm="3">
                            <span class="fw-bold">Nota</span>
                        </Col>
                        <Col sm="9">
                            :
                            <span class:perdida={parseFloat(Nota.Nota) < 3}>
                                {Nota.Nota}
                            </span>
                        </Col>
                    </Row>
                    <Row>
                        <Col sm="3">
                            <span class="fw-bold">Fecha Nota</span>
                        </Col>
                        <Col sm="9">
                            : {Nota.Fechat}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Label for="exampleText"
                                >Escriba alguna observación o comentario al
                                profesor</Label
                            >
                            <Input
                                type="textarea"
                                name="text"
                                id="exampleText"
                                bind:value={observacion}
                            />
                        </Col>
                    </Row>
                </div>
            </Alert>
        </form>
    </ModalBody>
    <ModalFooter>
        <Button class="rounded-0" color="primary" on:click={enviar}
            >Enviar
            {#if ingresando}
                <Spinner size="sm" />
            {/if}
        </Button>
    </ModalFooter>
</Modal>
<Modal />

<style>
    .perdida {
        color: red;
    }
</style>
