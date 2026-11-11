<?php

declare(strict_types=1);

/**
 * GetExcusas.php — excusas de un estudiante.
 *
 * Este archivo corresponde a:
 *
 *   backend/GetExcusas.php   ->   https://app.iedeoccidente.com/est/php/GetExcusas.php
 *
 * (ver backend/LEEME-SUBIR.txt: el contenido de backend\ se despliega en /est/php/)
 *
 * Entrada (JSON, igual que el resto del API del colegio):
 *
 *   { "estudiante": "1056140988", "periodo": "TRES", "year": 2026, "todos": false }
 *
 *   - estudiante : obligatorio.
 *   - periodo    : opcional, se acepta para no romper el contrato del frontend,
 *                  pero NO filtra: el modal de inasistencias necesita las excusas
 *                  de todos los periodos para cruzarlas por fecha.
 *   - year       : opcional, por defecto el año en curso (igual que el API
 *                  original). Con "todos": true se devuelven todos los años.
 *
 * Salida:
 *
 *   { "total": 2, "excusas": [ { ...columnas de excusas..., "texto": "ENFERMEDAD" } ] }
 *
 * El campo "texto" viene resuelto para que el frontend no tenga que repetir el
 * concat_ws(' ', motivo, motivo_permiso) que hace GetInasistencias.php.
 *
 * Diferencias con el GetExcusas.php que corria en local (acc/php/GetExcusas.php):
 *   - no revienta con fatal error cuando el estudiante no tiene excusas;
 *   - la consulta del listado usa el mismo filtro que la del conteo;
 *   - sentencias preparadas en lugar de interpolar el estudiante en el SQL;
 *   - responde con codigos HTTP reales (400/404/500) y siempre JSON valido.
 */

// ---------------------------------------------------------------------------
// CORS: el frontend en dev vive en otro puerto (Vite), asi que se permite el
// origen que hace la peticion. Sin credenciales: no se envian cookies.
// ---------------------------------------------------------------------------
$origen = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origen !== '') {
    header('Access-Control-Allow-Origin: ' . $origen);
    header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---------------------------------------------------------------------------
// Conexion a la base de datos
// ---------------------------------------------------------------------------
function responder(int $codigo, array $cuerpo): void
{
    http_response_code($codigo);
    echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    exit;
}

function conexion(): PDO
{
    // Mismo convenio que public/getInfoAcad.php: el archivo de credenciales es
    // datosConexion.php (o su variante datos_conexion.php) junto a este script.
    foreach (['datosConexion.php', 'datos_conexion.php'] as $nombre) {
        $ruta = __DIR__ . '/' . $nombre;
        if (is_file($ruta)) {
            require_once $ruta;
        }
        // Tambien se busca en la carpeta padre, por si el despliegue lo guarda
        // un nivel arriba de /est/php/.
        $rutaPadre = dirname(__DIR__) . '/' . $nombre;
        if (is_file($rutaPadre)) {
            require_once $rutaPadre;
        }
    }

    $host     = !empty($host)     ? (string) $host     : (getenv('DB_HOST') ?: 'localhost');
    $user     = !empty($user)     ? (string) $user     : (getenv('DB_USER') ?: 'root');
    $pass     = !empty($pass)     ? (string) $pass     : (getenv('DB_PASS') ?: '');
    $database = !empty($database) ? (string) $database : (getenv('DB_NAME') ?: 'occidente');

    try {
        $dsn = "mysql:host={$host};dbname={$database};charset=utf8mb4";
        return new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        error_log('GetExcusas conexion: ' . $e->getMessage());
        responder(500, [
            'total'   => 0,
            'excusas' => [],
            'error'   => 'No se pudo conectar a la base de datos. Revisa ' .
                'backend/datosConexion.php (host, usuario, contrasena y base de datos).',
        ]);
        throw $e; // Inalcanzable: responder() termina el script.
    }
}

/** Texto de la excusa: mismo criterio que concat_ws(' ', motivo, motivo_permiso). */
function textoDeExcusa(array $fila): string
{
    // Se conserva el texto tal como lo escribio el acudiente/secretaria, sin
    // repetirlo cuando motivo y motivo_permiso son el mismo valor.
    $vistos = [];
    $salida = [];
    foreach (['motivo', 'motivo_permiso'] as $campo) {
        $valor = trim((string) ($fila[$campo] ?? ''));
        $clave = mb_strtolower($valor);
        if ($valor === '' || isset($vistos[$clave])) {
            continue;
        }
        $vistos[$clave] = true;
        $salida[] = $valor;
    }
    if ($salida !== []) {
        return implode(' ', $salida);
    }

    $causa = trim((string) ($fila['causa'] ?? ''));
    return mb_strtolower($causa) === 'no aplica' ? '' : $causa;
}

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------
try {
    $crudo = file_get_contents('php://input');
    $entrada = json_decode(is_string($crudo) ? $crudo : '', true);
    if (!is_array($entrada)) {
        $entrada = [];
    }

    // El frontend puede mandar los campos con otra capitalizacion (Estudiante,
    // Periodo...); se normalizan las claves para no depender de eso.
    $normalizada = [];
    foreach ($entrada as $clave => $valor) {
        $normalizada[mb_strtolower((string) $clave)] = $valor;
    }

    $estudiante = trim((string) ($normalizada['estudiante'] ?? $normalizada['estudiante_id'] ?? ''));
    if ($estudiante === '') {
        responder(400, ['total' => 0, 'excusas' => [], 'error' => 'Falta el campo estudiante']);
    }
    if (!ctype_digit($estudiante)) {
        responder(400, ['total' => 0, 'excusas' => [], 'error' => 'El estudiante debe ser numerico']);
    }

    $todosLosAnios = filter_var($normalizada['todos'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $year = $todosLosAnios ? null : (int) ($normalizada['year'] ?? date('Y'));

    $db = conexion();

    $sql = 'SELECT ind, estudiante, fecha, causa, motivo, periodo, horas, motivo_permiso,
                   hora_salida, acudiente, otros, telefono_acudiente, fechahora, year
              FROM excusas
             WHERE estudiante = :estudiante';
    $params = [':estudiante' => $estudiante];

    if ($year !== null) {
        $sql .= ' AND year = :year';
        $params[':year'] = $year;
    }
    $sql .= ' ORDER BY fechahora DESC, ind DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $filas = $stmt->fetchAll();

    foreach ($filas as $i => $fila) {
        $filas[$i]['texto'] = textoDeExcusa($fila);
    }

    responder(200, [
        'total'   => count($filas),
        'excusas' => $filas,
    ]);
} catch (PDOException $e) {
    error_log('GetExcusas PDOException: ' . $e->getMessage());
    responder(500, ['total' => 0, 'excusas' => [], 'error' => 'Error de base de datos']);
} catch (Throwable $e) {
    error_log('GetExcusas error: ' . $e->getMessage());
    responder(500, ['total' => 0, 'excusas' => [], 'error' => 'Error interno']);
}
