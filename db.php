<?php
// Centralized Database Connection

$db_host = '31.97.208.49'; // Remote Hostinger IP for local development
$db_name = 'u902643667_imf_db07272026';
$db_user = 'u902643667_imf_db_admin';
$db_pass = 'vJZ9koQE:7qy*Ua[P0tY';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    // Explicitly set error mode to exception so writes will fail loudly rather than silently
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Fetch associations by default
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    // Return a clean JSON error response if connection fails
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}
?>
