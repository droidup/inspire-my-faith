<?php
// Simple PHP Proxy to route traffic to local Node.js port 3000
$request_uri = $_SERVER['REQUEST_URI'];
$url = 'http://127.0.0.1:3000' . $request_uri;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);

// Pass the request method (GET, POST, PUT, DELETE, etc.)
$method = $_SERVER['REQUEST_METHOD'];
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Pass all headers from the client to the Node server
$headers = [];
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        if (strtolower($name) !== 'host') {
            $headers[] = "$name: $value";
        }
    }
}
// Add explicit content type for JSON if not present
$headers[] = "Content-Type: application/json";
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Pass the body for POST/PUT requests
if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH' || $method === 'DELETE') {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

// Execute the request
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

// Send the exact response back to the client
http_response_code($httpcode);
if ($content_type) {
    header("Content-Type: " . $content_type);
} else {
    header("Content-Type: application/json");
}

echo $response;
?>
