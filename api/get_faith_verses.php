<?php
require_once 'cors.php';
require_once '../db.php';

$user_id = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "User ID is required"]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT v.*, GROUP_CONCAT(vc.collection_name SEPARATOR '|||') as collections
        FROM user_faith_verses v
        LEFT JOIN user_faith_verse_collections vc ON v.id = vc.verse_id
        WHERE v.user_id = ?
        GROUP BY v.id
        ORDER BY v.is_pinned DESC, v.saved_at DESC
    ");
    $stmt->execute([$user_id]);
    $rows = $stmt->fetchAll();
    
    $verses = array();
    foreach ($rows as $row) {
        $verses[] = array(
            "id" => $row['id'],
            "bookName" => $row['book_name'],
            "chapter" => (int)$row['chapter'],
            "verseNum" => (int)$row['verse_num'],
            "text" => $row['text'],
            "version" => $row['version'],
            "note" => $row['note'] ? $row['note'] : '',
            "savedAt" => (int)$row['saved_at'],
            "isPinned" => (int)$row['is_pinned'] === 1,
            "isMemorized" => (int)$row['is_memorized'] === 1,
            "collections" => $row['collections'] ? explode('|||', $row['collections']) : array()
        );
    }
    
    echo json_encode(["success" => true, "data" => $verses]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
