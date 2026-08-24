<?php

declare(strict_types=1);
require_once("cors.php");
require_once("datosConexion.php");

if (!isset($host, $user, $pass, $database)) {
    http_response_code(500);
    echo json_encode(['error' => 'Configuracion de base de datos no encontrada']);
    exit;
}

$dbConfig = [
    'host'     => $host,
    'user'     => $user,
    'pass'     => $pass,
    'database' => $database,
];

header('Content-Type: application/json; charset=utf-8');

function getDb(array $dbConfig): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['database']};charset=utf8mb4";
        $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON invalido']);
        exit;
    }

    $asignacion = $input['asignacion'] ?? '';
    $nivel = (int) ($input['nivel'] ?? 0);
    $grado = $input['grado'] ?? '';
    $valoract = (float) ($input['valoract'] ?? 0.0);
    $asignatura = $input['asignatura'] ?? '';
    $periodo = $input['periodo'] ?? '';
    $HED = $input['HED'] ?? '';
    $year = Date('Y');

    if ($asignacion === '' || $nivel <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Campos requeridos: asignacion, nivel']);
        exit;
    }

    $db = getDb($dbConfig);

    $stmtEscala = $db->prepare(
        'SELECT valoracion 
         FROM escalas_1290 
         WHERE :promedio BETWEEN inicio AND fin 
           AND year = :year 
         LIMIT 1'
    );
    $stmtEscala->execute([':promedio' => $valoract, ':year' => $year]);
    $escala = $stmtEscala->fetch();
    $desempeno=$escala['valoracion'];

    $stmtDesc = $db->prepare(
        'SELECT descripcion 
         FROM desempenos 
         WHERE grado = :grado 
           AND asignatura = :asignatura 
           AND periodo = :periodo
           AND desempeno = :desempeno
           AND year = :year 
         LIMIT 1'
    );
    $paramsDesc = [':grado' => $grado, ':asignatura' => $asignatura, ':periodo' => $periodo, ':desempeno' => $desempeno, ':year' => $year];
    $stmtDesc->execute($paramsDesc);
    $desc = $stmtDesc->fetch();

    $stmtPct = $db->prepare(
        'SELECT porcentaje 
         FROM porcentajes_area_colegio 
         WHERE nivel = :nivel 
           AND asignatura = :asignatura 
           AND year = :year 
         LIMIT 1'
    );
    $stmtPct->execute([':nivel' => $nivel, ':asignatura' => $asignatura, ':year' => $year]);
    $pct = $stmtPct->fetch();

    $resultado = [
        'desempeno'  => $desempeno,
        'descripcion' => $desc['descripcion'],
        
    ];

    echo json_encode($resultado);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos']);
    error_log("getInfoAcad PDOException: " . $e->getMessage());
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error interno']);
    error_log("getInfoAcad error: " . $e->getMessage());
}