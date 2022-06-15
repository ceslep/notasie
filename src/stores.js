import { writable } from "svelte/store";

export const user = writable({
    displayName: "",
    email: "",
    photoURL: "",
    phoneNumber: "",
    
});

export const userFull = writable({
    displayName: "",
    email: "",
    photoURL: "",
    phoneNumber: "",
    identificacion: "",
    nombres: "",
    fechanacimiento: "",
    google:"",
    genero: "",
    direccion: ""
});
export const isLoggedIn = writable(false);