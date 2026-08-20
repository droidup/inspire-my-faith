<?php
require_once 'cors.php';
require_once '../db.php';

try {
    $stmt1 = $pdo->query("SELECT COUNT(*) as count FROM topics");
    $topicCount = $stmt1->fetch(PDO::FETCH_ASSOC)['count'];

    $stmt2 = $pdo->query("SELECT COUNT(*) as count FROM verse_topics");
    $mappingCount = $stmt2->fetch(PDO::FETCH_ASSOC)['count'];

    echo json_encode(["success" => true, "data" => ["topicCount" => (int)$topicCount, "mappingCount" => (int)$mappingCount]]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
