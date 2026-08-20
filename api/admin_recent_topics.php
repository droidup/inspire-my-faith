<?php
require_once 'cors.php';
require_once '../db.php';

try {
    $sql = "SELECT t.id, t.name, t.keywords, COUNT(vt.verse_id) as verse_count
            FROM topics t
            LEFT JOIN verse_topics vt ON t.id = vt.topic_id
            GROUP BY t.id
            ORDER BY t.id DESC LIMIT 10";
    $stmt = $pdo->query($sql);
    $topics = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "data" => $topics]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
