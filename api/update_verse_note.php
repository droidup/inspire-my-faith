<?php
require_once 'cors.php';
require_once '../db.php';

$input = json_decode(file_get_contents('php://input'), true);

$user_id = isset($input['userId']) ? $input['userId'] : null;
$note = isset($input['note']) ? $input['note'] : '';
$verse_id = isset($_GET['verseId']) ? $_GET['verseId'] : null;

// Allow verseId to be in the body as fallback if not in query string
if (!$verse_id && isset($input['verseId'])) {
    $verse_id = $input['verseId'];
}

if (!$user_id || !$verse_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing userId or verseId"]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE user_faith_verses SET note = ? WHERE id = ? AND user_id = ?");
    $stmt->execute([$note, $verse_id, $user_id]);
    
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
