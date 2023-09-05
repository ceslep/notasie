<script>
  import { afterUpdate } from "svelte";

  export let notas;

  let data = [];

  afterUpdate(() => {
    let asignaturas = new Set([...notas.map((nota) => nota.asignatura)]);
    console.log(asignaturas);
    data = [];
    asignaturas.forEach((asignatura) => {
      const datos = notas.filter((nota) => nota.asignatura === asignatura);
      let fila = { asignatura };
      let vs = [];
      const valoracions = datos.forEach((val) => {
        vs = [...vs, val.valoracion];
      });
      vs =
        vs.length === 1
          ? [...vs, "0", "0", "0"]
          : vs.length === 2
          ? [...vs, "0", "0"]
          : vs.length === 3
          ? [...vs, "0"]
          : [...vs];
      fila = { ...fila, valoraciones: vs };
      data = [...data, fila];
    });
  });

  const perdida = (node) => {
    const val = parseFloat(node.textContent);
    if (val < 3) {
      node.classList.add("text-danger");
      node.classList.add("fw-bold");
    }
  };
</script>

<main>
  <div class="table-responsive">
    <table class="table">
      <thead>
        <tr>
          <th class="text-center align-middle">Asignatura</th>
          <th class="text-center align-middle">P1</th>
          <th class="text-center align-middle">P2</th>
          <th class="text-center align-middle">P3</th>
          <th class="text-center align-middle">P4</th>
          <th class="text-center align-middle">Final</th>
        </tr>
      </thead>
      <tbody>
        {#each data as { asignatura, valoraciones }, index}
          <tr>
            <td class="align-middle">{asignatura}</td>
            {#each valoraciones as valoracion, index}
              <td
                class="text-center align-middle"
                class:perdida={valoracion < 3}>{valoracion ?? 0}</td
              >
            {/each}
            <td class="text-center align-middle" use:perdida>
              {valoraciones
                .reduce(
                  (a, b, index, array) =>
                    a + parseFloat(b ? b : 0) / array.length,
                  0
                )
                .toFixed(1)}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</main>

<style>
  .perdida {
    color: red;
    font-weight: bold;
  }
</style>
