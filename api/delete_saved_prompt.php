<?php
require_once 'cors.php';
require_once '../db.php';

$prompt_id = isset($_GET['promptId']) ? $_GET['promptId'] : null;
$user_id = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$prompt_id || !$user_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required parameters"]);
    exit();
}

try {
    $pdo->beginTransaction();

    $stmt1 = $pdo->prepare("DELETE FROM user_prompt_collections WHERE prompt_id = ?");
    $stmt1->execute([$prompt_id]);

    $stmt2 = $pdo->prepare("DELETE FROM user_saved_prompts WHERE id = ? AND user_id = ?");
    $stmt2->execute([$prompt_id, $user_id]);

    $pdo->commit();
    echo json_encode(["success" => true]);
} catch(PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error", "error" => $e->getMessage()]);
}
?>
