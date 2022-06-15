<script>
  import { auth } from "../firebase";
  import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
  import { FacebookAuthProvider } from "firebase/auth";

  import { user,userFull, isLoggedIn } from "../stores";
  import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardSubtitle,
    CardText,
    CardTitle,
    Image,
  } from "sveltestrap";
  import { Badge, Form, FormGroup, Input, Label, Row, Col } from "sveltestrap";
  import { createEventDispatcher, onMount } from "svelte";
  import Swal from "sweetalert2";

  const dispatch = createEventDispatcher();

  let fechanac="";
  let register = false;
  let form;
  let identificacion="";
  let errorVid=true;
  let idVerificado=false;
  let emailVerificado=false;
  let telefono="";
  let email="";
  let nombres="";
  let google=false;
  let genero="";
  let direccion="";

  let validateEmail=true;

  const entrarConGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      $user = res.user;
      emailVerificado=true;
      telefono=$user.phoneNumber!=null?$user.phoneNumber:"";
      nombres=$user.displayName!=null?$user.displayName:"";
      email=$user.email!=null?$user.email:"";
      $userFull.photoURL=$user.photoURL;
      $isLoggedIn = true;
      google=true;
      register = true;
    } catch (error) {
      console.error(error);
    }
  };

  const entrarConFacebook = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const res = await signInWithPopup(auth, provider);
      $user = res.user;
      emailVerificado=true;
      telefono=$user.phoneNumber!=null?$user.phoneNumber:"";
      nombres=$user.displayName!=null?$user.displayName:"";
      email=$user.email!=null?$user.email:"";
      $userFull.photoURL=$user.photoURL;
      $isLoggedIn = true;
      google=true;
      register = true;
    } catch (error) {
      console.error(error);
    }
  };

  const salir = async () => {
    try {
      await auth.signOut();
      $user = {
        displayName: "",
        email: "",
        photoURL: "",
        phoneNumber: "",
      

      };
      $userFull.identificacion="";
      $userFull.nombres="";
      $userFull.fechanacimiento="";
      $userFull.photoURL="";
      $userFull.email="";
      $userFull.phoneNumber="";
      $isLoggedIn = false;
      dispatch("logout", {
        value: "logout",
      });
    } catch (error) {
      console.error(error);
    }
  };

  onMount(async () => {
    fechanac = new Date().toISOString().substring(0, 10);
  });

  
  const registrarse = async (e)=>{
    
    console.log(e);
    console.log($userFull);
    let id=$userFull.identificacion;
    // @ts-ignore
    if (!verificarId||!validateEmail){
      Swal.fire({
        title: "Error",
        text: "Revise por favor los valores ingresados",
        icon: "error",
      });
    console.log($userFull);
  }
  let response = await fetch("https://app.iedeoccidente.com/est/php/register.php", {
    method: "POST",
    body: JSON.stringify($userFull),
  });
  let registrado = await response.json();
  if (registrado.msj==="ok"){
    Swal.fire({
      title: "Registro exitoso",
      text: "Puede iniciar sesión",
      icon: "success",
    });
    register=false;
    $userFull.identificacion="";
    $userFull.nombres="";
    $userFull.fechanacimiento="";
    $userFull.photoURL="";
    $userFull.email="";
    $userFull.phoneNumber="";
    $userFull.genero="";
    $userFull.direccion="";
    $isLoggedIn = false;
    dispatch("logout", {
        value: "registrado",
      });
  }
}

const verificarId = async ()=>{
  if (identificacion.length>0){
    let response = await fetch("https://app.iedeoccidente.com/est/php/verificarId.php",{
        method:"POST",
        body:JSON.stringify({
            identificacion
        })
    });
    let data = await response.json();
    errorVid=data.verificado&&identificacion.length>0;
    idVerificado=data.verificado;
    return data.verificado=true;
  }
  errorVid=true;
  return true;
}

const emailValido=(email)=>{
  let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const limpiar = (e)=>{
  e.preventDefault();
  form.reset();
  identificacion="";
  errorVid=true;
  idVerificado=false;
  validateEmail=true;
  fechanac = ""
  fechanac = new Date().toISOString().substring(0, 10);
  genero="";
  direccion="";
}

$:validateEmail=emailValido(email);

$:console.log(validateEmail);

$:console.log(fechanac);  

$:$userFull.identificacion=identificacion;
$:$userFull.nombres=nombres;
$:$userFull.fechanacimiento=fechanac;
$:$userFull.email=email;
$:$userFull.phoneNumber=telefono;
$:$userFull.displayName=nombres;
$:$userFull.google=google?"S":"N";
$:$userFull.genero=genero;
$:$userFull.direccion=direccion;

const keyvalue = (event) => {
 
  // @ts-ignore
  if(identificacion.length>0)
  console.log([...identificacion].map((i,j)=>identificacion.charCodeAt(j)).filter(i=>!(i>=48&&i<=57)).length);
  
  
  // @ts-ignore
  if ([...identificacion].map((i,j)=>identificacion.charCodeAt(j)).filter(i=>!(i>=48&&i<=57)).length>0) {

    Swal.fire({
      title: "Error",
      text: "El campo identificación solo acepta números enteros",
      icon: "error",
    });
    identificacion="";
   
}
};

</script>

<div class="d-flex justify-content-evenly my-2 mx-auto">
  {#if !$isLoggedIn}
    <Button color="light" on:click={entrarConGoogle}>
      <img src="https://w7.pngwing.com/pngs/557/90/png-transparent-google-logo-g-suite-google-text-logo-business-thumbnail.png" alt="" width="25" height="25" />
      Entrar con Google</Button>
      <Button color="light" on:click={entrarConFacebook}>
        <img src="https://icones.pro/wp-content/uploads/2021/02/facebook-logo-icone.png" alt="" width="25" height="25" />
        Entrar con Facebook</Button>
  {:else}
    {#if !register}
    <Button on:click={salir}>Salir</Button>
    
    
    {/if}
  {/if}
  </div>

<main class="mx-0 my-2 d-flex justify-content-center flex-column">
  {#if $isLoggedIn && !register}
    <div class="w-auto mx-auto">
      <Card class="mb-3">
        <CardHeader>
          <CardTitle class="align-middle">Info de Usuario</CardTitle>
        </CardHeader>
        <CardBody>
          <CardSubtitle>{$userFull.displayName}</CardSubtitle>
          <CardText>
            <small class="text-muted">{$user.email}</small>
          </CardText>
          <Image src={$userFull.photoURL} />
        </CardBody>
        <CardFooter>www.iedeoccidente.com</CardFooter>
      </Card>
    </div>
  {/if}

  {#if !$isLoggedIn || register}
    <div class="w-100 mx-auto ">
      <Card class="mb-3">
        <CardHeader>
          <CardTitle class="align-middle">Registro</CardTitle>
        </CardHeader>
        <CardBody>
            <form bind:this={form} on:submit|preventDefault={registrarse}>
            <Row>
              <Col sm="12" md="6">
                <FormGroup floating label="Identificación del estudiante matriculado">
                  <Input
                  type="text"
                    placeholder="identificación del estudiante matriculado en la institución"
                    style="inputmode:numeric;"
                    name="identificacion"
                    required
                    bind:value={identificacion}
                    invalid={!errorVid}
                    on:blur={verificarId}
                    disabled={idVerificado}
                    feedback={!errorVid?"No se encuentra este número de identificación del estudiante":identificacion.length===0?"":"Identificación encontrada"}
                    on:keyup={keyvalue}
                    
                  />
                </FormGroup>
              </Col>
              <Col sm="12" md="6">
                <FormGroup floating label="Email del estudiante">
                  <Input placeholder="Email" bind:value={email} 
                  name="email"
                  required
                  invalid={!validateEmail}
                  disabled={emailVerificado}
                  feedback="Email inválido"
                 
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col>
                <FormGroup floating label="Nombres del estudiante">
                  <Input placeholder="Nombres" bind:value={nombres} 
                  required
                  name="nombres"/>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col sm="12" md="6">
                <FormGroup floating label="Teléfono del estudiante">
                  <Input  placeholder="Teléfono"  name="telefono"
                  bind:value={telefono}
                  invalid={telefono.length<10}
                  required
                  feedback="ingrese un número de teléfono válido"
                  />
                </FormGroup>
              </Col>
              <Col sm="12" md="6">
                <FormGroup floating label="Fecha Nacimiento del estudiante.">
                  <Input
                    type="date"
                    name="fechanac"
                    placeholder="Fecha Nac."
                    bind:value={fechanac}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col sm="12" md="6">
                <FormGroup floating label="Género del estudiante">
                  <Input type="select" name="genero" bind:value={genero} required>
                    <option></option>
                    <option>Masculino</option>
                    <option>Femenino</option>
                    <option>Otro</option>
                    
                  </Input>
                </FormGroup>
              </Col>
              <Col sm="12" md="6">
                <FormGroup floating label="Dirección">
                  <Input type="text" name="direccion" bind:value={direccion} required>
                   
                    
                  </Input>
                </FormGroup>
              </Col>
            </Row>
            <Row> 
              <Col>
                <Button color="danger" class="mx-auto d-block w-100" type="reset" on:click={(e)=>{
                  limpiar(e);
                }}>Limpiar</Button>
              </Col>
                <Col>
                  <Button color="primary" class="mx-auto d-block w-100" disabled={!(verificarId&&validateEmail&&$user.displayName.length>5&&telefono.length>=10)}>Registrarse</Button>
                </Col>
            </Row>
           
          </form>
        </CardBody>
        <CardFooter class="text-center">www.iedeoccidente.com</CardFooter>
      </Card>
    </div>
  {/if}

  
</main>
