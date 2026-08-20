<?php
require_once 'cors.php';
require_once '../db.php';

// Get JSON POST data
$input = json_decode(file_get_contents('php://input'), true);

$user_id = isset($input['user_id']) ? $input['user_id'] : null;
$text = isset($input['text']) ? $input['text'] : '';
$emotion = isset($input['emotion']) ? $input['emotion'] : 'General';
$prayer = isset($input['prayer']) ? $input['prayer'] : '';
$verses = isset($input['verses']) ? json_encode($input['verses']) : '[]';

if (empty($text)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Text is required"]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO soul_searches (user_id, search_text, emotion, generated_prayer, verses) 
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$user_id, $text, $emotion, $prayer, $verses]);
    
    echo json_encode([
        "success" => true,
        "message" => "Soul search saved successfully",
        "id" => $pdo->lastInsertId()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Database write failed: " . $e->getMessage()
    ]);
}
?>
