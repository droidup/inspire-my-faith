<?php
require_once 'cors.php';
require_once '../db.php';

$bookId = isset($_GET['bookId']) ? $_GET['bookId'] : null;

if (!$bookId) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing bookId parameter"]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT MAX(chapter) as chapterCount FROM verses WHERE book_id = ?");
    $stmt->execute([$bookId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(["success" => true, "data" => (int)$row['chapterCount']]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
