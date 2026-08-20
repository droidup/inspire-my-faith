<?php
require_once 'cors.php';
require_once '../db.php';

$user_id = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing userId parameter"]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT p.*, GROUP_CONCAT(pc.collection_name SEPARATOR '|||') as collections
        FROM user_saved_prompts p
        LEFT JOIN user_prompt_collections pc ON p.id = pc.prompt_id
        WHERE p.user_id = ?
        GROUP BY p.id
        ORDER BY p.timestamp DESC
    ");
    $stmt->execute([$user_id]);
    
    $prompts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted = array_map(function($p) {
        return [
            "id" => $p['id'],
            "userId" => $p['user_id'],
            "text" => $p['text'],
            "timestamp" => (float)$p['timestamp'],
            "isPinned" => (bool)$p['is_pinned'],
            "collections" => $p['collections'] ? explode('|||', $p['collections']) : []
        ];
    }, $prompts);

    echo json_encode(["success" => true, "data" => $formatted]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error", "error" => $e->getMessage()]);
}
?>
