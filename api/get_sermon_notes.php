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
        SELECT n.*, GROUP_CONCAT(nc.collection_name SEPARATOR '|||') as collections
        FROM user_sermon_notes n
        LEFT JOIN user_note_collections nc ON n.id = nc.note_id
        WHERE n.user_id = ?
        GROUP BY n.id
        ORDER BY n.date DESC
    ");
    $stmt->execute([$user_id]);
    
    $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted = array_map(function($n) {
        return [
            "id" => $n['id'],
            "userId" => $n['user_id'],
            "title" => $n['title'],
            "speaker" => $n['speaker'],
            "date" => $n['date'],
            "scriptures" => $n['scriptures'] ? explode(',', $n['scriptures']) : [],
            "notes" => $n['notes'],
            "takeaways" => $n['takeaways'] ? explode('|||', $n['takeaways']) : [],
            "timestamp" => (float)$n['timestamp'],
            "collections" => $n['collections'] ? explode('|||', $n['collections']) : [],
            "isPinned" => (bool)$n['is_pinned']
        ];
    }, $notes);

    echo json_encode(["success" => true, "data" => $formatted]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error", "error" => $e->getMessage()]);
}
?>
