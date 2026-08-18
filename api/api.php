<?php
// API Security Key - Your Node.js app must send this exact key in the headers
define('API_KEY', 'IMF_SECRET_KEY_902643667_2026');

// Database Credentials
$db_host = '127.0.0.1'; // Always 127.0.0.1 or localhost on Hostinger
$db_name = 'u902643667_imf_db07272026';
$db_user = 'u902643667_imf_db_admin';
$db_pass = 'vJZ9koQE:7qy*Ua[P0tY';

// Enable CORS so your Node app can talk to it
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. Verify the API Key
$headers = getallheaders();
$provided_key = isset($headers['x-api-key']) ? $headers['x-api-key'] : '';

if ($provided_key !== API_KEY) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Invalid API Key.']);
    exit();
}

// 2. Connect to the Database
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    // Set error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// 3. Get the requested action/query from the Node.js app
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['query'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No SQL query provided in the request body.']);
    exit();
}

$sql = $input['query'];
$params = isset($input['params']) ? $input['params'] : [];

// 4. Execute the Query
try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Check if it was a SELECT query
    if (stripos(trim($sql), 'SELECT') === 0 || stripos(trim($sql), 'SHOW') === 0 || stripos(trim($sql), 'DESCRIBE') === 0) {
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $results]);
    } else {
        // For INSERT, UPDATE, DELETE
        echo json_encode([
            'success' => true, 
            'affected_rows' => $stmt->rowCount(),
            'insert_id' => $pdo->lastInsertId()
        ]);
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Query execution failed: ' . $e->getMessage(), 'sql' => $sql]);
}
?>
