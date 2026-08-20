<?php
require_once 'cors.php';
require_once '../db.php';

$user_id = isset($_GET['userId']) ? $_GET['userId'] : null;
$verse_id = isset($_GET['verseId']) ? $_GET['verseId'] : null;

if (!$user_id || !$verse_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing userId or verseId"]);
    exit();
}

try {
    $pdo->beginTransaction();
    
    $stmt1 = $pdo->prepare("DELETE FROM user_faith_verses WHERE id = ? AND user_id = ?");
    $stmt1->execute([$verse_id, $user_id]);
    
    // We only delete collections if the verse was actually deleted (user owns it)
    if ($stmt1->rowCount() > 0) {
        $stmt2 = $pdo->prepare("DELETE FROM user_faith_verse_collections WHERE verse_id = ?");
        $stmt2->execute([$verse_id]);
    }
    
    $pdo->commit();
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
