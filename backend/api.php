<?php

declare(strict_types=1);

/**
 * Red Social Escolar - API unica.
 *
 * Una accion por request:
 *   GET  api.php?action=feed&estudiante=123
 *   POST api.php  { "action": "...", ... }
 *
 * Toda publicacion y comentario nace en estado 'pendiente' y solo se muestra
 * al resto de estudiantes cuando el moderador lo aprueba.
 */

require_once __DIR__ . '/social_config.php';

// ---------------------------------------------------------------------------
// CORS
//
// No se reutiliza cors.php del sistema del colegio a proposito: ese archivo
// puede estar limitado a localhost y dejaria sin cabeceras las peticiones de
// produccion. Aqui las cabeceras se calculan de forma segura:
//   - mismo origen -> no se envia ninguna cabecera (no hace falta)
//   - otro origen  -> se refleja solo si es el propio dominio o es local (desarrollo)
//
// El token de sesion viaja en el cuerpo (nunca en cookies), asi que no se
// emiten cabeceras de credenciales.
// ---------------------------------------------------------------------------
$origenPeticion = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origenPeticion !== '') {
    $hostPeticion = (string) ($_SERVER['HTTP_HOST'] ?? '');
    $permitido = false;

    if ($hostPeticion !== '') {
        if ($origenPeticion === 'http://' . $hostPeticion || $origenPeticion === 'https://' . $hostPeticion) {
            $permitido = true;
        }
    }
    if (preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origenPeticion)) {
        $permitido = true;
    }

    if ($permitido) {
        header('Access-Control-Allow-Origin: ' . $origenPeticion);
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Social-Token, X-Mod-Code');
        header('Access-Control-Max-Age: 86400');
    }
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------
$raw  = file_get_contents('php://input');
$body = [];
if (is_string($raw) && $raw !== '') {
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $body = $decoded;
    }
}

$action = (string) ($body['action'] ?? $_GET['action'] ?? $_POST['action'] ?? '');

// ---------------------------------------------------------------------------
// Servido de imagenes.
// Devuelve el archivo solo si esta referenciado por una publicacion real, con
// el tipo MIME detectado por contenido. Asi no depende del .htaccess y una
// imagen borrada deja de ser accesible al instante.
// ---------------------------------------------------------------------------
if ($action === 'imagen') {
    $idImagen = validarId((string) ($body['id'] ?? $_GET['id'] ?? ''));
    if ($idImagen === null) {
        http_response_code(400);
        exit;
    }

    try {
        $dbImg = socialDb();
        $stmtImg = $dbImg->prepare('SELECT imagen FROM social_posts WHERE id = :id');
        $stmtImg->execute([':id' => $idImagen]);
        $filaImg = $stmtImg->fetch();

        if (!$filaImg || !$filaImg['imagen']) {
            http_response_code(404);
            exit;
        }

        $relImg = (string) $filaImg['imagen'];
        // Solo rutas con el formato exacto que genera guardarImagen().
        if (!preg_match('#^social/uploads/\d{8}-[a-f0-9]{16}\.(jpg|png|webp|gif)$#', $relImg)) {
            http_response_code(404);
            exit;
        }

        $absImg  = realpath(__DIR__ . '/' . $relImg);
        $baseImg = realpath(__DIR__ . '/social/uploads');
        if (!$absImg || !$baseImg || !str_starts_with($absImg, $baseImg) || !is_file($absImg)) {
            http_response_code(404);
            exit;
        }

        $mimeImg = (new finfo(FILEINFO_MIME_TYPE))->file($absImg);
        if (!in_array($mimeImg, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true)) {
            http_response_code(403);
            exit;
        }

        header('Content-Type: ' . $mimeImg);
        header('Content-Length: ' . (string) filesize($absImg));
        header('Cache-Control: private, max-age=3600');
        header('X-Content-Type-Options: nosniff');
        readfile($absImg);
        exit;
    } catch (Throwable $e) {
        error_log('social api imagen: ' . $e->getMessage());
        http_response_code(500);
        exit;
    }
}

// ---------------------------------------------------------------------------
// Base de datos
// ---------------------------------------------------------------------------
function socialDb(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = $user = $pass = $database = null;

    if (file_exists(__DIR__ . '/datosConexion.php')) {
        require __DIR__ . '/datosConexion.php';
    }

    $host     = $host     ?: (getenv('DB_HOST') ?: 'localhost');
    $user     = $user     ?: (getenv('DB_USER') ?: 'root');
    $pass     = $pass     ?: (getenv('DB_PASS') ?: '');
    $database = $database ?: (getenv('DB_NAME') ?: 'occidente');

    $pdo = new PDO(
        "mysql:host={$host};dbname={$database};charset=utf8mb4",
        (string) $user,
        (string) $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );

    return $pdo;
}

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------
function fail(int $status, string $mensaje): void
{
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $mensaje], JSON_UNESCAPED_UNICODE);
    exit;
}

function ok(array $data = []): void
{
    echo json_encode(['ok' => true] + $data, JSON_UNESCAPED_UNICODE);
    exit;
}

// ---------------------------------------------------------------------------
// Identidad
// ---------------------------------------------------------------------------
/**
 * Hash de la contrasena del estudiante. Se guarda en social_usuarios y sirve
 * como token de sesion: el servidor puede recalcularlo sin guardar la
 * contrasena en claro.
 */
function passHash(string $estudiante, string $pass): string
{
    return hash_hmac('sha256', $estudiante . '|' . $pass, SOCIAL_TOKEN_SECRET);
}

/**
 * Comprueba identificacion + contrasena contra la tabla oficial del colegio.
 * Devuelve el nombre real del estudiante o null.
 */
function verificarEstudiante(PDO $db, string $estudiante, string $pass): ?array
{
    if ($estudiante === '' || $pass === '') {
        return null;
    }
    $year = date('Y');
    $stmt = $db->prepare(
        'SELECT estudiante, nombres, nivel, numero, pass
           FROM estugrupos
          WHERE estudiante = :estudiante
            AND pass = :pass
            AND year = :year
          LIMIT 1'
    );
    $stmt->execute([':estudiante' => $estudiante, ':pass' => $pass, ':year' => $year]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * Valida el token de sesion de la red social sin volver a pedir la contrasena.
 */
function requireToken(array $body, int $status = 401, bool $permitirModerador = false): array
{
    $estudiante = trim((string) ($body['estudiante'] ?? ''));
    $token      = trim((string) ($body['token'] ?? ($_SERVER['HTTP_X_SOCIAL_TOKEN'] ?? '')));

    // El docente puede publicar con su codigo en lugar de una sesion de
    // estudiante: el es quien aprueba, no necesita pasar por moderacion.
    if ($permitirModerador && esModerador($body)) {
        return ['estudiante' => 'moderador', 'nombres' => 'Docente', 'docente' => true];
    }

    if ($estudiante === '' || $token === '') {
        // Un docente que intenta publicar sin codigo valido recibe una pista
        // concreta en lugar de un mensaje generico.
        if ($permitirModerador) {
            fail(
                $status,
                'Hace falta la sesion de estudiante o tu codigo de moderador. ' .
                    'Si eres docente, verifica el codigo en el panel de moderacion.'
            );
        }
        fail($status, 'Sesion no valida');
    }

    $db = socialDb();

    $stmt = $db->prepare(
        'SELECT nombres, pass_hash FROM social_usuarios WHERE estudiante = :e LIMIT 1'
    );
    $stmt->execute([':e' => $estudiante]);
    $u = $stmt->fetch();
    if (!$u || !$u['pass_hash']) {
        fail($status, 'Sesion no valida');
    }

    // El token emitido en el login es exactamente el pass_hash guardado.
    if (!hash_equals((string) $u['pass_hash'], $token)) {
        fail($status, 'Sesion expirada, vuelve a entrar');
    }

    return ['estudiante' => $estudiante, 'nombres' => (string) $u['nombres']];
}

function esModerador(array $body): bool
{
    $code = (string) ($body['mod_code'] ?? ($_SERVER['HTTP_X_MOD_CODE'] ?? ''));
    return $code !== '' && hash_equals(SOCIAL_MOD_CODE, $code);
}

function requireModerador(array $body): void
{
    if (!esModerador($body)) {
        fail(403, 'Solo el moderador puede hacer esta accion');
    }
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function limpiarTexto(string $texto, int $max): string
{
    $texto = trim($texto);
    if ($texto === '') {
        return '';
    }
    // Sin HTML: el frontend muestra texto plano.
    $texto = strip_tags($texto);
    $texto = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $texto) ?? $texto;
    if (mb_strlen($texto) > $max) {
        $texto = mb_substr($texto, 0, $max);
    }
    return trim($texto);
}

function validarId(string $valor): ?int
{
    if ($valor === '' || !ctype_digit($valor)) {
        return null;
    }
    $n = (int) $valor;
    return $n > 0 ? $n : null;
}

/**
 * Guarda una imagen enviada en base64. Devuelve la URL publica relativa.
 */
function guardarImagen(string $dataUrl): ?string
{
    if (!preg_match('#^data:image/(jpeg|jpg|png|webp|gif);base64,#i', $dataUrl, $m)) {
        return null;
    }

    $bin = base64_decode(substr($dataUrl, strpos($dataUrl, ',') + 1), true);
    if ($bin === false || $bin === '') {
        return null;
    }
    if (strlen($bin) > SOCIAL_MAX_IMAGEN_BYTES) {
        return null;
    }

    $tipos = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif',
    ];

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = (string) $finfo->buffer($bin);
    if (!isset($tipos[$mime])) {
        return null;
    }

    $dir = __DIR__ . '/social/uploads';
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        return null;
    }

    $nombre = date('Ymd') . '-' . bin2hex(random_bytes(8)) . '.' . $tipos[$mime];
    if (file_put_contents($dir . '/' . $nombre, $bin, LOCK_EX) === false) {
        return null;
    }

    return 'social/uploads/' . $nombre;
}

/**
 * Reacciones disponibles (estilo Facebook).
 * La clave es lo que se guarda en la base de datos.
 */
const SOCIAL_REACCIONES = [
    'me_gusta'    => 'Me gusta',
    'me_encanta'  => 'Me encanta',
    'me_importa'  => 'Me importa',
    'me_divierte' => 'Me divierte',
    'me_asombra'  => 'Me asombra',
    'me_entristece' => 'Me entristece',
    'me_enoja'    => 'Me enoja',
];

function reaccionValida(string $tipo): bool
{
    return isset(SOCIAL_REACCIONES[$tipo]);
}

/**
 * Cuenta las reacciones de un post agrupadas por tipo.
 * Devuelve solo las que tienen al menos un voto. Es una consulta constante
 * (una sola, independiente del numero de reacciones distintas).
 */
function reaccionesDe(PDO $db, int $postId): array
{
    $stmt = $db->prepare(
        'SELECT tipo, COUNT(*) AS n FROM social_reacciones
          WHERE post_id = :p GROUP BY tipo ORDER BY n DESC'
    );
    $stmt->execute([':p' => $postId]);

    $out = [];
    foreach ($stmt->fetchAll() as $fila) {
        $out[(string) $fila['tipo']] = (int) $fila['n'];
    }
    return $out;
}

function totalReacciones(array $reacciones): int
{
    return array_sum($reacciones);
}

/**
 * Convierte las columnas reac_* de una fila en un objeto { tipo: conteo }.
 * Solo incluye las reacciones con al menos un voto.
 */
function conReacciones(array $fila): array
{
    $reacciones = [];
    $total = 0;
    foreach (array_keys(SOCIAL_REACCIONES) as $clave) {
        $campo = 'reac_' . $clave;
        if (isset($fila[$campo])) {
            $n = (int) $fila[$campo];
            unset($fila[$campo]);
            if ($n > 0) {
                $reacciones[$clave] = $n;
                $total += $n;
            }
        }
    }
    $fila['reacciones'] = $reacciones;
    $fila['total_reacciones'] = $total;
    $fila['yo_reaccion'] = $fila['yo_reaccion'] ?? null;

    return $fila;
}

/**
 * URL publica de la imagen de una publicacion.
 *
 * Se construye como ruta ABSOLUTA a partir de la ubicacion real de este archivo
 * (que puede estar en /est/php/ o en otra carpeta). Antes se devolvia una ruta
 * relativa ('api.php?...'), que el navegador resolvia contra la pagina de la app
 * y apuntaba a la carpeta equivocada.
 */
function urlImagen(?int $postId, ?string $ruta): ?string
{
    if ($postId === null || !$ruta) {
        return null;
    }

    $script = (string) ($_SERVER['SCRIPT_NAME'] ?? '/api.php');
    $base = rtrim(str_replace('\\', '/', dirname($script)), '/');

    return $base . '/api.php?action=imagen&id=' . $postId;
}

/**
 * Convierte la ruta de imagen de cada fila en su URL publica.
 * Se hace en PHP (no en SQL) porque una funcion de MySQL exigiria permisos
 * especiales que no estan garantizados en produccion.
 */
function conImagen(array $filas): array
{
    foreach ($filas as $i => $fila) {
        if (array_key_exists('imagen', $fila)) {
            $filas[$i]['imagen'] = urlImagen((int) $fila['id'], $fila['imagen']);
        }
    }
    return $filas;
}

function borrarImagen(?string $ruta): void
{
    if (!$ruta) {
        return;
    }
    if (!str_starts_with($ruta, 'social/uploads/')) {
        return;
    }
    $abs = realpath(__DIR__ . '/' . $ruta);
    $base = realpath(__DIR__ . '/social/uploads');
    if ($abs && $base && str_starts_with($abs, $base) && is_file($abs)) {
        @unlink($abs);
    }
}

/**
 * Añade columnas que falten en una tabla ya existente.
 * Permite actualizar una instalacion sin borrar datos.
 *
 * @param array<string,string> $columnas nombre => definicion SQL
 */
function socialAsegurarColumnas(PDO $db, string $tabla, array $columnas): void
{
    $stmt = $db->prepare(
        'SELECT COLUMN_NAME FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t'
    );
    $stmt->execute([':t' => $tabla]);

    $existentes = [];
    foreach ($stmt->fetchAll() as $fila) {
        $existentes[(string) $fila['COLUMN_NAME']] = true;
    }

    foreach ($columnas as $nombre => $definicion) {
        if (isset($existentes[$nombre])) {
            continue;
        }
        // El nombre de la columna no puede ir como parametro preparado; se
        // valida contra un patron estricto antes de interpolarlo.
        if (!preg_match('/^[a-z_]{1,32}$/', $nombre)) {
            continue;
        }
        $db->exec("ALTER TABLE {$tabla} ADD COLUMN {$nombre} {$definicion}");
    }
}

// ---------------------------------------------------------------------------
// Instalacion de tablas (idempotente)
// ---------------------------------------------------------------------------
function instalarTablas(PDO $db): void
{
    $db->exec(
        "CREATE TABLE IF NOT EXISTS social_posts (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            estudiante VARCHAR(20) NOT NULL,
            autor_nombre VARCHAR(120) NOT NULL,
            nivel VARCHAR(10) NOT NULL DEFAULT '',
            numero VARCHAR(10) NOT NULL DEFAULT '',
            contenido TEXT NOT NULL,
            imagen VARCHAR(255) NULL,
            estado VARCHAR(12) NOT NULL DEFAULT 'pendiente',
            motivo_rechazo VARCHAR(255) NULL,
            revisado_por VARCHAR(60) NULL,
            revisado_en DATETIME NULL,
            editado TINYINT(1) NOT NULL DEFAULT 0,
            editado_por VARCHAR(60) NULL,
            editado_en DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_estado_fecha (estado, created_at),
            KEY idx_estudiante (estudiante)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    // Compatibilidad con instalaciones previas sin las columnas de edicion.
    socialAsegurarColumnas($db, 'social_posts', [
        'editado'     => "TINYINT(1) NOT NULL DEFAULT 0",
        'editado_por' => 'VARCHAR(60) NULL',
        'editado_en'  => 'DATETIME NULL',
    ]);

    $db->exec(
        "CREATE TABLE IF NOT EXISTS social_comentarios (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            post_id INT UNSIGNED NOT NULL,
            estudiante VARCHAR(20) NOT NULL,
            autor_nombre VARCHAR(120) NOT NULL,
            contenido VARCHAR(400) NOT NULL,
            estado VARCHAR(12) NOT NULL DEFAULT 'pendiente',
            editado TINYINT(1) NOT NULL DEFAULT 0,
            editado_por VARCHAR(60) NULL,
            editado_en DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_post_estado (post_id, estado),
            KEY idx_estado_fecha (estado, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    // Compatibilidad con instalaciones previas sin las columnas de edicion.
    socialAsegurarColumnas($db, 'social_comentarios', [
        'editado'     => "TINYINT(1) NOT NULL DEFAULT 0",
        'editado_por' => 'VARCHAR(60) NULL',
        'editado_en'  => 'DATETIME NULL',
    ]);

    $db->exec(
        "CREATE TABLE IF NOT EXISTS social_reacciones (
            post_id INT UNSIGNED NOT NULL,
            estudiante VARCHAR(20) NOT NULL,
            tipo VARCHAR(12) NOT NULL DEFAULT 'me_gusta',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (post_id, estudiante),
            KEY idx_tipo (post_id, tipo)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $db->exec(
        "CREATE TABLE IF NOT EXISTS social_reportes (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            post_id INT UNSIGNED NOT NULL,
            estudiante VARCHAR(20) NOT NULL,
            motivo VARCHAR(200) NULL,
            estado VARCHAR(12) NOT NULL DEFAULT 'nuevo',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_post (post_id),
            UNIQUE KEY uniq_reporte (post_id, estudiante)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $db->exec(
        "CREATE TABLE IF NOT EXISTS social_usuarios (
            estudiante VARCHAR(20) NOT NULL,
            nombres VARCHAR(120) NOT NULL,
            nivel VARCHAR(10) NOT NULL DEFAULT '',
            numero VARCHAR(10) NOT NULL DEFAULT '',
            pass_hash VARCHAR(128) NOT NULL DEFAULT '',
            ultimo_acceso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (estudiante)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    // Compatibilidad con instalaciones previas sin la columna pass_hash.
    $col = $db->query(
        "SELECT COUNT(*) AS n FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'social_usuarios'
            AND COLUMN_NAME = 'pass_hash'"
    )->fetch();
    if ((int) ($col['n'] ?? 0) === 0) {
        $db->exec(
            "ALTER TABLE social_usuarios
                ADD COLUMN pass_hash VARCHAR(128) NOT NULL DEFAULT '' AFTER numero"
        );
    }

    $db->exec(
        "CREATE TABLE IF NOT EXISTS social_config (
            clave VARCHAR(60) NOT NULL,
            valor VARCHAR(255) NOT NULL,
            PRIMARY KEY (clave)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

// ---------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------
try {
    $db = socialDb();

    if ($action === 'install') {
        instalarTablas($db);
        ok(['mensaje' => 'Tablas de la red social creadas o ya existentes']);
    }

    // Diagnostico de despliegue. No expone credenciales ni datos de estudiantes;
    // solo indica que piezas estan presentes y funcionando.
    if ($action === 'diagnostico') {
        $tablas = [];
        $faltantes = [];
        foreach (['social_posts', 'social_comentarios', 'social_reacciones', 'social_reportes', 'social_usuarios', 'social_config'] as $t) {
            $q = $db->prepare(
                'SELECT COUNT(*) AS n FROM information_schema.TABLES
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t'
            );
            $q->execute([':t' => $t]);
            $existe = (int) $q->fetch()['n'] > 0;
            $tablas[$t] = $existe;
            if (!$existe) {
                $faltantes[] = $t;
            }
        }

        $q = $db->query('SELECT COUNT(*) AS n FROM estugrupos');
        $estudiantes = (int) $q->fetch()['n'];

        $dir = __DIR__ . '/social/uploads';
        ok([
            'php'               => PHP_VERSION,
            'base_de_datos'     => true,
            'tabla_estudiantes' => $estudiantes > 0,
            'total_estudiantes' => $estudiantes,
            'tablas'            => $tablas,
            'tablas_faltantes'  => $faltantes,
            'carpeta_imagenes'  => is_dir($dir) && is_writable($dir),
            'curl'              => function_exists('curl_init'),
            'mod_code_por_defecto' => (SOCIAL_MOD_CODE === 'occidente-moderador'),
            'secret_por_defecto'   => (SOCIAL_TOKEN_SECRET === 'cambia-esta-clave-secreta-red-social'),
        ]);
    }

    // Asegura que las tablas existan antes de cualquier otra accion.
    instalarTablas($db);

    switch ($action) {
        // -------------------------------------------------------------------
        case 'login': {
            $identificacion = trim((string) ($body['identificacion'] ?? ''));
            $pass           = (string) ($body['pass'] ?? '');

            $est = verificarEstudiante($db, $identificacion, $pass);
            if (!$est) {
                fail(401, 'Documento o contrasena incorrectos');
            }

            $passHash = passHash($identificacion, $pass);

            $stmt = $db->prepare(
                'INSERT INTO social_usuarios (estudiante, nombres, nivel, numero, pass_hash, ultimo_acceso)
                 VALUES (:e, :n, :niv, :num, :ph, NOW())
                 ON DUPLICATE KEY UPDATE nombres = VALUES(nombres), nivel = VALUES(nivel),
                    numero = VALUES(numero), pass_hash = VALUES(pass_hash), ultimo_acceso = NOW()'
            );
            $stmt->execute([
                ':e'   => (string) $est['estudiante'],
                ':n'   => (string) $est['nombres'],
                ':niv' => (string) ($est['nivel'] ?? ''),
                ':num' => (string) ($est['numero'] ?? ''),
                ':ph'  => $passHash,
            ]);

            ok([
                'token'      => $passHash,
                'estudiante' => (string) $est['estudiante'],
                'nombres'    => (string) $est['nombres'],
                'nivel'      => (string) ($est['nivel'] ?? ''),
                'numero'     => (string) ($est['numero'] ?? ''),
            ]);
        }

        // -------------------------------------------------------------------
        // Feed publico: se puede LEER sin iniciar sesion. Al publicar o
        // comentar es cuando se pide identificacion.
        case 'feed': {
            // Tolerante con peticiones antiguas: si llega un estudiante vacio o
            // invalido se atiende igual como invitado, sin devolver error.
            $yo = trim((string) ($body['estudiante'] ?? $_GET['estudiante'] ?? ''));
            if ($yo !== '' && validarId($yo) === null) {
                $yo = '';
            }

            // Cada reaccion distinta se cuenta en su propia subconsulta, siempre
            // parametrizada (nunca interpolando texto en el SQL).
            $partes = [];
            $params = [];
            foreach (array_keys(SOCIAL_REACCIONES) as $i => $clave) {
                $partes[] = "(SELECT COUNT(*) FROM social_reacciones r$i
                               WHERE r$i.post_id = p.id AND r$i.tipo = :rt$i) AS reac_$clave";
                $params[":rt$i"] = $clave;
            }
            $sqlReacciones = implode(",\n                        ", $partes);

            $yoReaccion = '';
            if ($yo !== '') {
                $yoReaccion = ", (SELECT r9.tipo FROM social_reacciones r9
                                    WHERE r9.post_id = p.id AND r9.estudiante = :yo2 LIMIT 1) AS yo_reaccion";
                $params[':yo2'] = $yo;
            }

            $sql = "SELECT p.id, p.autor_nombre, p.nivel, p.numero, p.contenido, p.imagen,
                        p.estado, p.motivo_rechazo, p.created_at,
                        p.editado, p.editado_por, p.editado_en,
                        (p.estudiante = 'moderador') AS es_docente,
                        $sqlReacciones,
                        (SELECT COUNT(*) FROM social_comentarios c
                          WHERE c.post_id = p.id AND c.estado = 'aprobado') AS comentarios
                        $yoReaccion
                   FROM social_posts p
                  WHERE p.estado = 'aprobado'
                  ORDER BY p.created_at DESC
                  LIMIT 100";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            $filas = conImagen($stmt->fetchAll());
            $posts = array_map('conReacciones', $filas);

            ok([
                'posts'      => $posts,
                'reacciones' => SOCIAL_REACCIONES,
            ]);
        }

        // -------------------------------------------------------------------
        case 'mis_pendientes': {
            $u = requireToken($body);

            $stmt = $db->prepare(
                "SELECT id, contenido, imagen, estado, motivo_rechazo, created_at
                   FROM social_posts
                  WHERE estudiante = :e AND estado IN ('pendiente', 'rechazado')
                  ORDER BY created_at DESC
                  LIMIT 50"
            );
            $stmt->execute([':e' => $u['estudiante']]);
            $posts = conImagen($stmt->fetchAll());

            $stmt = $db->prepare(
                "SELECT c.id, c.post_id, c.contenido, c.estado, c.created_at, p.contenido AS post_contenido
                   FROM social_comentarios c
                   JOIN social_posts p ON p.id = c.post_id
                  WHERE c.estudiante = :e AND c.estado IN ('pendiente', 'rechazado')
                  ORDER BY c.created_at DESC
                  LIMIT 50"
            );
            $stmt->execute([':e' => $u['estudiante']]);

            ok(['posts' => $posts, 'comentarios' => $stmt->fetchAll()]);
        }

        // -------------------------------------------------------------------
        case 'crear_post': {
            $u = requireToken($body, 401, true);
            $esDocente = !empty($u['docente']);

            $contenido = limpiarTexto((string) ($body['contenido'] ?? ''), SOCIAL_MAX_TEXTO);
            $imagen    = null;

            if (isset($body['imagen']) && is_string($body['imagen']) && $body['imagen'] !== '') {
                $imagen = guardarImagen($body['imagen']);
                if ($imagen === null) {
                    fail(400, 'La imagen no es valida (usa JPG, PNG o WEBP de menos de 4 MB)');
                }
            }

            if ($contenido === '' && $imagen === null) {
                fail(400, 'Escribe algo o adjunta una imagen');
            }

            // Lo que publica el docente se aprueba al instante: el es el
            // moderador, no tiene sentido pedirle que se apruebe a si mismo.
            $estado = $esDocente ? 'aprobado' : 'pendiente';
            $nombre = $esDocente ? 'Docente' : (string) $u['nombres'];

            $stmt = $db->prepare(
                'INSERT INTO social_posts (estudiante, autor_nombre, nivel, numero, contenido, imagen, estado, revisado_por)
                 VALUES (:e, :n, :niv, :num, :c, :i, :st, :rev)'
            );

            // Completa nivel/numero desde social_usuarios (solo estudiantes).
            $nivel = '';
            $numero = '';
            if (!$esDocente) {
                $d = $db->prepare('SELECT nivel, numero FROM social_usuarios WHERE estudiante = :e');
                $d->execute([':e' => $u['estudiante']]);
                $extra = $d->fetch() ?: ['nivel' => '', 'numero' => ''];
                $nivel = (string) $extra['nivel'];
                $numero = (string) $extra['numero'];
            }

            $stmt->execute([
                ':e'   => (string) $u['estudiante'],
                ':n'   => $nombre,
                ':niv' => $nivel,
                ':num' => $numero,
                ':c'   => $contenido,
                ':i'   => $imagen,
                ':st'  => $estado,
                ':rev' => $esDocente ? 'moderador' : null,
            ]);

            ok([
                'id'             => (int) $db->lastInsertId(),
                'estado'         => $estado,
                'auto_aprobado'  => $esDocente,
                'mensaje'        => $esDocente
                    ? 'Publicado'
                    : 'Tu publicacion quedo pendiente de aprobacion',
            ]);
        }

        // -------------------------------------------------------------------
        // Reacciones estilo Facebook. Un voto por estudiante y publicacion;
        // volver a pulsar la misma reaccion la quita.
        case 'reaccion':
        case 'like': {
            // El docente tambien puede reaccionar: se identifica con su codigo
            // y queda registrado como 'moderador'.
            $u = requireToken($body, 401, true);
            $postId = validarId((string) ($body['post_id'] ?? ''));
            if ($postId === null) {
                fail(400, 'Publicacion invalida');
            }

            $tipo = (string) ($body['tipo'] ?? 'me_gusta');
            if (!reaccionValida($tipo)) {
                fail(400, 'Reaccion no valida');
            }

            $chk = $db->prepare("SELECT id FROM social_posts WHERE id = :id AND estado = 'aprobado'");
            $chk->execute([':id' => $postId]);
            if (!$chk->fetch()) {
                fail(404, 'Publicacion no disponible');
            }

            $q = $db->prepare(
                'SELECT tipo FROM social_reacciones WHERE post_id = :p AND estudiante = :e'
            );
            $q->execute([':p' => $postId, ':e' => $u['estudiante']]);
            $actual = $q->fetch();

            if ($actual && (string) $actual['tipo'] === $tipo) {
                // Misma reaccion -> se quita.
                $db->prepare('DELETE FROM social_reacciones WHERE post_id = :p AND estudiante = :e')
                   ->execute([':p' => $postId, ':e' => $u['estudiante']]);
                $mia = null;
            } else {
                // Nueva reaccion o cambio de una anterior.
                $db->prepare(
                    'INSERT INTO social_reacciones (post_id, estudiante, tipo)
                     VALUES (:p, :e, :t)
                     ON DUPLICATE KEY UPDATE tipo = VALUES(tipo)'
                )->execute([':p' => $postId, ':e' => $u['estudiante'], ':t' => $tipo]);
                $mia = $tipo;
            }

            $reacciones = reaccionesDe($db, $postId);

            ok([
                'mi_reaccion' => $mia,
                'reacciones'  => $reacciones,
                'total'       => totalReacciones($reacciones),
            ]);
        }

        // -------------------------------------------------------------------
        case 'comentarios': {
            $postId = validarId((string) ($body['post_id'] ?? $_GET['post_id'] ?? ''));
            if ($postId === null) {
                fail(400, 'Publicacion invalida');
            }
            $stmt = $db->prepare(
                "SELECT id, autor_nombre, contenido, created_at, editado, editado_por
                   FROM social_comentarios
                  WHERE post_id = :p AND estado = 'aprobado'
                  ORDER BY created_at ASC
                  LIMIT 200"
            );
            $stmt->execute([':p' => $postId]);
            ok(['comentarios' => $stmt->fetchAll()]);
        }

        // -------------------------------------------------------------------
        case 'comentar': {
            // El docente comenta con su codigo; su comentario se aprueba al
            // instante porque el mismo es quien modera.
            $u = requireToken($body, 401, true);
            $esDocente = !empty($u['docente']);
            $postId = validarId((string) ($body['post_id'] ?? ''));
            if ($postId === null) {
                fail(400, 'Publicacion invalida');
            }

            $contenido = limpiarTexto((string) ($body['contenido'] ?? ''), SOCIAL_MAX_COMENTARIO);
            if ($contenido === '') {
                fail(400, 'El comentario esta vacio');
            }

            $chk = $db->prepare("SELECT id FROM social_posts WHERE id = :id AND estado = 'aprobado'");
            $chk->execute([':id' => $postId]);
            if (!$chk->fetch()) {
                fail(404, 'Publicacion no disponible');
            }

            $stmt = $db->prepare(
                'INSERT INTO social_comentarios (post_id, estudiante, autor_nombre, contenido, estado)
                 VALUES (:p, :e, :n, :c, :st)'
            );
            $stmt->execute([
                ':p'  => $postId,
                ':e'  => (string) $u['estudiante'],
                ':n'  => $esDocente ? 'Docente' : (string) $u['nombres'],
                ':c'  => $contenido,
                ':st' => $esDocente ? 'aprobado' : 'pendiente',
            ]);

            ok([
                'auto_aprobado' => $esDocente,
                'mensaje'       => $esDocente
                    ? 'Comentario publicado'
                    : 'Tu comentario quedo pendiente de aprobacion',
            ]);
        }

        // -------------------------------------------------------------------
        case 'reportar': {
            $u = requireToken($body);
            $postId = validarId((string) ($body['post_id'] ?? ''));
            if ($postId === null) {
                fail(400, 'Publicacion invalida');
            }
            $motivo = limpiarTexto((string) ($body['motivo'] ?? ''), 200);

            $stmt = $db->prepare(
                'INSERT INTO social_reportes (post_id, estudiante, motivo)
                 VALUES (:p, :e, :m)
                 ON DUPLICATE KEY UPDATE motivo = VALUES(motivo)'
            );
            $stmt->execute([':p' => $postId, ':e' => $u['estudiante'], ':m' => $motivo]);

            ok(['mensaje' => 'Gracias, el moderador revisara la publicacion']);
        }

        // -------------------------------------------------------------------
        // Edicion del texto de una publicacion.
        //
        // El moderador puede editar CUALQUIER publicacion (por ejemplo, para
        // corregir faltas de ortografia) y el estudiante la suya mientras siga
        // pendiente de aprobacion. En ambos casos se deja registro de quien
        // edito y cuando, para que el cambio sea trazable.
        case 'editar_post': {
            $u = requireToken($body, 401, true);
            $esDocente = !empty($u['docente']);

            $postId = validarId((string) ($body['post_id'] ?? ''));
            if ($postId === null) {
                fail(400, 'Publicacion invalida');
            }

            $contenido = limpiarTexto((string) ($body['contenido'] ?? ''), SOCIAL_MAX_TEXTO);

            $q = $db->prepare('SELECT id, estudiante, contenido, imagen, estado FROM social_posts WHERE id = :id');
            $q->execute([':id' => $postId]);
            $post = $q->fetch();
            if (!$post) {
                fail(404, 'Publicacion no encontrada');
            }

            if (!$esDocente) {
                if ((string) $post['estudiante'] !== $u['estudiante']) {
                    fail(403, 'Solo puedes editar tus propias publicaciones');
                }
                if ((string) $post['estado'] !== 'pendiente') {
                    fail(403, 'Ya no puedes editar esta publicacion porque fue revisada');
                }
            }

            // No se permite dejar la publicacion sin texto si tampoco tiene imagen.
            if ($contenido === '' && empty($post['imagen'])) {
                fail(400, 'El contenido no puede quedar vacio');
            }

            $stmt = $db->prepare(
                'UPDATE social_posts
                    SET contenido = :c, editado = 1, editado_por = :por, editado_en = NOW()
                  WHERE id = :id'
            );
            $stmt->execute([
                ':c'   => $contenido,
                ':por' => $esDocente ? 'moderador' : (string) $u['estudiante'],
                ':id'  => $postId,
            ]);

            ok([
                'contenido'      => $contenido,
                'editado_por'    => $esDocente ? 'moderador' : (string) $u['estudiante'],
                'por_docente'    => $esDocente,
                'mensaje'        => $esDocente
                    ? 'Publicacion corregida. Queda registrado que la edito el docente.'
                    : 'Publicacion actualizada',
            ]);
        }

        // -------------------------------------------------------------------
        // Edicion de un comentario. El moderador puede editar cualquiera.
        case 'editar_comentario': {
            $u = requireToken($body, 401, true);
            $esDocente = !empty($u['docente']);

            $idComentario = validarId((string) ($body['id'] ?? $body['comentario_id'] ?? ''));
            if ($idComentario === null) {
                fail(400, 'Comentario invalido');
            }

            $contenido = limpiarTexto((string) ($body['contenido'] ?? ''), SOCIAL_MAX_COMENTARIO);
            if ($contenido === '') {
                fail(400, 'El comentario no puede quedar vacio');
            }

            $q = $db->prepare('SELECT id, estudiante, estado FROM social_comentarios WHERE id = :id');
            $q->execute([':id' => $idComentario]);
            $comentario = $q->fetch();
            if (!$comentario) {
                fail(404, 'Comentario no encontrado');
            }

            if (!$esDocente) {
                if ((string) $comentario['estudiante'] !== $u['estudiante']) {
                    fail(403, 'Solo puedes editar tus propios comentarios');
                }
                if ((string) $comentario['estado'] !== 'pendiente') {
                    fail(403, 'Ya no puedes editar este comentario porque fue revisado');
                }
            }

            $stmt = $db->prepare(
                'UPDATE social_comentarios
                    SET contenido = :c, editado = 1, editado_por = :por, editado_en = NOW()
                  WHERE id = :id'
            );
            $stmt->execute([
                ':c'   => $contenido,
                ':por' => $esDocente ? 'moderador' : (string) $u['estudiante'],
                ':id'  => $idComentario,
            ]);

            ok([
                'contenido'   => $contenido,
                'editado_por' => $esDocente ? 'moderador' : (string) $u['estudiante'],
                'por_docente' => $esDocente,
                'mensaje'     => $esDocente ? 'Comentario corregido por el docente' : 'Comentario actualizado',
            ]);
        }

        // -------------------------------------------------------------------
        case 'borrar_propio': {
            $u = requireToken($body);
            $postId = validarId((string) ($body['post_id'] ?? ''));
            if ($postId === null) {
                fail(400, 'Publicacion invalida');
            }

            $q = $db->prepare('SELECT imagen FROM social_posts WHERE id = :id AND estudiante = :e');
            $q->execute([':id' => $postId, ':e' => $u['estudiante']]);
            $row = $q->fetch();
            if (!$row) {
                fail(404, 'No puedes borrar esta publicacion');
            }

            $db->prepare('DELETE FROM social_posts WHERE id = :id AND estudiante = :e')
               ->execute([':id' => $postId, ':e' => $u['estudiante']]);
            $db->prepare('DELETE FROM social_likes WHERE post_id = :id')->execute([':id' => $postId]);
            $db->prepare('DELETE FROM social_comentarios WHERE post_id = :id')->execute([':id' => $postId]);
            borrarImagen($row['imagen']);

            ok(['mensaje' => 'Publicacion eliminada']);
        }

        // -------------------------------------------------------------------
        // Acciones del moderador
        // -------------------------------------------------------------------
        case 'mod_login': {
            if (!esModerador($body)) {
                fail(403, 'Codigo de moderador incorrecto');
            }
            $stmt = $db->query(
                "SELECT COUNT(*) AS n FROM social_posts WHERE estado = 'pendiente'"
            );
            $pendientes = (int) $stmt->fetch()['n'];
            ok(['pendientes' => $pendientes]);
        }

        case 'mod_listar': {
            requireModerador($body);
            $tipo = (string) ($body['tipo'] ?? 'posts');

            if ($tipo === 'comentarios') {
                $stmt = $db->query(
                    "SELECT c.id, c.post_id, c.autor_nombre, c.contenido, c.created_at,
                            p.contenido AS post_contenido
                       FROM social_comentarios c
                       LEFT JOIN social_posts p ON p.id = c.post_id
                      WHERE c.estado = 'pendiente'
                      ORDER BY c.created_at ASC
                      LIMIT 200"
                );
                ok(['items' => conImagen($stmt->fetchAll())]);
            }

            $estado = (string) ($body['estado'] ?? 'pendiente');
            $permitidos = ['pendiente', 'aprobado', 'rechazado'];
            if (!in_array($estado, $permitidos, true)) {
                $estado = 'pendiente';
            }

            $stmt = $db->prepare(
                "SELECT p.id, p.estudiante, p.autor_nombre, p.nivel, p.numero, p.contenido,
                        p.imagen, p.estado, p.motivo_rechazo, p.created_at,
                        p.editado, p.editado_por,
                        (SELECT COUNT(*) FROM social_reportes r WHERE r.post_id = p.id) AS reportes
                   FROM social_posts p
                  WHERE p.estado = :e
                  ORDER BY p.created_at DESC
                  LIMIT 200"
            );
            $stmt->execute([':e' => $estado]);
            $items = [];
            foreach ($stmt->fetchAll() as $fila) {
                $fila['reacciones'] = reaccionesDe($db, (int) $fila['id']);
                $items[] = $fila;
            }
            ok(['items' => conImagen($items)]);
        }

        case 'mod_aprobar': {
            requireModerador($body);
            $tipo = (string) ($body['tipo'] ?? 'post');
            $id   = validarId((string) ($body['id'] ?? ''));
            if ($id === null) {
                fail(400, 'Elemento invalido');
            }

            if ($tipo === 'comentario') {
                $stmt = $db->prepare(
                    "UPDATE social_comentarios SET estado = 'aprobado' WHERE id = :id"
                );
                $stmt->execute([':id' => $id]);
            } else {
                $stmt = $db->prepare(
                    "UPDATE social_posts
                        SET estado = 'aprobado', revisado_en = NOW(),
                            motivo_rechazo = NULL, revisado_por = :por
                      WHERE id = :id"
                );
                $stmt->execute([':por' => 'moderador', ':id' => $id]);
            }

            ok(['mensaje' => 'Aprobado']);
        }

        case 'mod_rechazar': {
            requireModerador($body);
            $tipo   = (string) ($body['tipo'] ?? 'post');
            $id     = validarId((string) ($body['id'] ?? ''));
            $motivo = limpiarTexto((string) ($body['motivo'] ?? ''), 200);

            if ($id === null) {
                fail(400, 'Elemento invalido');
            }

            if ($tipo === 'comentario') {
                $stmt = $db->prepare(
                    "UPDATE social_comentarios SET estado = 'rechazado' WHERE id = :id"
                );
                $stmt->execute([':id' => $id]);
            } else {
                $stmt = $db->prepare(
                    "UPDATE social_posts
                        SET estado = 'rechazado', motivo_rechazo = :m,
                            revisado_en = NOW(), revisado_por = :por
                      WHERE id = :id"
                );
                $stmt->execute([
                    ':m'   => $motivo !== '' ? $motivo : null,
                    ':por' => 'moderador',
                    ':id'  => $id,
                ]);
            }

            ok(['mensaje' => 'Rechazado']);
        }

        case 'mod_borrar': {
            requireModerador($body);
            $id = validarId((string) ($body['id'] ?? ''));
            if ($id === null) {
                fail(400, 'Publicacion invalida');
            }

            $q = $db->prepare('SELECT imagen FROM social_posts WHERE id = :id');
            $q->execute([':id' => $id]);
            $row = $q->fetch();
            if (!$row) {
                fail(404, 'Publicacion no encontrada');
            }

            $db->prepare('DELETE FROM social_posts WHERE id = :id')->execute([':id' => $id]);
            $db->prepare('DELETE FROM social_likes WHERE post_id = :id')->execute([':id' => $id]);
            $db->prepare('DELETE FROM social_comentarios WHERE post_id = :id')->execute([':id' => $id]);
            $db->prepare('DELETE FROM social_reportes WHERE post_id = :id')->execute([':id' => $id]);
            borrarImagen($row['imagen']);

            ok(['mensaje' => 'Publicacion eliminada']);
        }

        case 'mod_resolver_reporte': {
            requireModerador($body);
            $id = validarId((string) ($body['id'] ?? ''));
            if ($id === null) {
                fail(400, 'Reporte invalido');
            }
            $db->prepare("UPDATE social_reportes SET estado = 'resuelto' WHERE id = :id")
               ->execute([':id' => $id]);            ok(['mensaje' => 'Reporte resuelto']);
        }

        default:
            fail(400, 'Accion desconocida');
    }
} catch (PDOException $e) {
    error_log('social api PDOException: ' . $e->getMessage());
    fail(500, 'Error de base de datos');
} catch (Throwable $e) {
    error_log('social api error: ' . $e->getMessage());
    fail(500, 'Error interno');
}
