<?php
require_once 'cors.php';
require_once '../db.php';

$note_id = isset($_GET['noteId']) ? $_GET['noteId'] : null;
$user_id = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$note_id || !$user_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required parameters"]);
    exit();
}

try {
    $pdo->beginTransaction();

    $stmt1 = $pdo->prepare("DELETE FROM user_note_collections WHERE note_id = ?");
    $stmt1->execute([$note_id]);

    $stmt2 = $pdo->prepare("DELETE FROM user_sermon_notes WHERE id = ? AND user_id = ?");
    $stmt2->execute([$note_id, $user_id]);

    $pdo->commit();
    echo json_encode(["success" => true]);
} catch(PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error", "error" => $e->getMessage()]);
}
?>
