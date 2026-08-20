<?php
require_once 'cors.php';
require_once '../db.php';

$bookId = isset($_GET['bookId']) ? $_GET['bookId'] : null;
$chapter = isset($_GET['chapter']) ? $_GET['chapter'] : null;

if (!$bookId || !$chapter) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing parameters"]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT summary FROM chapter_summaries WHERE book_id = ? AND chapter = ?");
    $stmt->execute([$bookId, $chapter]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($row) {
        echo json_encode(["success" => true, "data" => $row['summary']]);
    } else {
        echo json_encode(["success" => true, "data" => null]);
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
