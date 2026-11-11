<?php
/**
 * Configuracion de la Red Social Escolar.
 *
 * ESTE ARCHIVO LO EDITA EL ADMINISTRADOR.
 * Mantenerlo fuera del control de versiones en produccion si se cambian los valores.
 */

// Codigo que usa el moderador (docente/coordinador) para aprobar publicaciones.
// CAMBIAR ESTE VALOR en produccion.
if (!defined('SOCIAL_MOD_CODE')) {
    define('SOCIAL_MOD_CODE', 'occidente-moderador');
}

// Clave para firmar los tokens de sesion de los estudiantes.
// CAMBIAR ESTE VALOR en produccion por una cadena larga y aleatoria.
if (!defined('SOCIAL_TOKEN_SECRET')) {
    define('SOCIAL_TOKEN_SECRET', 'cambia-esta-clave-secreta-red-social');
}

// Limites de publicacion.
if (!defined('SOCIAL_MAX_TEXTO')) {
    define('SOCIAL_MAX_TEXTO', 500);
}
if (!defined('SOCIAL_MAX_COMENTARIO')) {
    define('SOCIAL_MAX_COMENTARIO', 300);
}
if (!defined('SOCIAL_MAX_IMAGEN_BYTES')) {
    define('SOCIAL_MAX_IMAGEN_BYTES', 4 * 1024 * 1024); // 4 MB
}
// Minutos que un docente puede deshacer un rechazo sin aprobacion manual.
if (!defined('SOCIAL_UNDO_MINUTOS')) {
    define('SOCIAL_UNDO_MINUTOS', 10);
}
