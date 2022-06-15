import * as bootstrap from "bootstrap";

export class ModalWin {
   emodal;
   lmodal;
   id;
   aceptar = false;
  constructor( title,  body,  customModal, fullScreen) {
    this.title = title;
    this.body = body;
    this.emodal = undefined;
    this.lmodal = undefined;
    this.customModal = customModal !== "" ? customModal : "";
    this.id = Math.floor(Math.random() * 100000).toString();
    this.fullScreen=fullScreen;
  }



   render() {
    let modalFullScreen='';
    if (this.fullScreen) modalFullScreen='modal-fullscreen';
    if (this.customModal === '') 
      this.customModal= `
        <div class="modal fade" id="modal${this.id}" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog ${modalFullScreen}" role="document">
          <div class="modal-content">
            <div class="modal-header text-white bg-primary">
              <h5 class="modal-title" id="exampleModalLabel">${this.title}</h5>
              <button type="button" class="close" data-bs-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              ${this.body}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              <button type="button" class="btn btn-primary aceptar" data-bs-dismiss="modal">Aceptar</button>
            </div>
          </div>
        </div>
      </div>
        `;
    
    
      return this.customModal;
  }


   showin(app) {
    app.innerHTML += this.render();
    this.emodal = document.getElementById(`modal${this.id}`);
    console.log(this.emodal);
    if (!this.lmodal) this.lmodal = new bootstrap.Modal(this.emodal);
    this.emodal.querySelector(".aceptar").addEventListener("click", (e) => {
      e.preventDefault();
      this.aceptar = true;
      this.lmodal.hide();
    });
    this.lmodal.show();
  }


   async showIn(app) {
    return new Promise((resolve) => {
      this.showin(app);
      this.emodal.addEventListener('hidden.bs.modal', (event) => {
        console.log(event)
        this.destroy();
        resolve(this.aceptar);
      });
    });
  }

   destroy() {
    this.lmodal.dispose();
    this.lmodal = undefined;
    this.emodal.remove();
  }
}


export default ModalWin;