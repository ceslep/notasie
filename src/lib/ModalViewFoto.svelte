<script>
    import {
        Button,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        Spinner,
        Image
    } from "sveltestrap";

    import { createEventDispatcher, onMount } from "svelte";
    import Swal from "sweetalert2";

    ;
    export let photoURL;

    const dispatch = createEventDispatcher();

    const closeModal = () => {
       
        dispatch("close");
    };
</script>

<Modal isOpen={true} class="anima_animated">
    <ModalHeader class="bg-primary text-white">Foto de perfil</ModalHeader>
    <ModalBody class="d-flex justify-content-center align-items-center flex-column" >
        <Image class="img-fluid mx-auto w-50" alt="" src={photoURL} />
        <slot />
    </ModalBody>
    <ModalFooter>
     
      <Button color="secondary" on:click={closeModal}>Cerrar</Button>
     
    </ModalFooter>
  </Modal>
  <Modal />
