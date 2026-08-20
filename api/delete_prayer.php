<?php
require_once 'cors.php';
require_once '../db.php';

$prayer_id = isset($_GET['prayerId']) ? $_GET['prayerId'] : null;
$user_id = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$prayer_id || !$user_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required parameters"]);
    exit();
}

try {
    $pdo->beginTransaction();

    // Delete junction table entries
    $stmt1 = $pdo->prepare("DELETE FROM user_prayer_collections WHERE prayer_id = ?");
    $stmt1->execute([$prayer_id]);

    // Delete the prayer itself
    $stmt2 = $pdo->prepare("DELETE FROM user_prayers WHERE id = ? AND user_id = ?");
    $stmt2->execute([$prayer_id, $user_id]);

    $pdo->commit();
    echo json_encode(["success" => true]);
} catch(PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error", "error" => $e->getMessage()]);
}
?>
