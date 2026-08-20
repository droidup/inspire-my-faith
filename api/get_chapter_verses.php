<?php
require_once 'cors.php';
require_once '../db.php';

$bookId = isset($_GET['bookId']) ? $_GET['bookId'] : null;
$chapter = isset($_GET['chapter']) ? $_GET['chapter'] : null;
$version = isset($_GET['version']) ? $_GET['version'] : 'KJV';

if (!$bookId || !$chapter) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing parameters"]);
    exit();
}

try {
    if ($version === 'KJV') {
        $stmt = $pdo->prepare("SELECT v.*, b.name as book_name FROM verses v JOIN books b ON v.book_id = b.id WHERE v.book_id = ? AND v.chapter = ? ORDER BY v.verse ASC");
        $stmt->execute([$bookId, $chapter]);
        $verses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Fetch translated verses. If missing, it will still return the row with translated_text as null
        $stmt = $pdo->prepare("
            SELECT v.*, b.name as book_name, vt.text as translated_text 
            FROM verses v 
            JOIN books b ON v.book_id = b.id 
            LEFT JOIN verse_translations vt ON v.id = vt.verse_id AND vt.version = ? 
            WHERE v.book_id = ? AND v.chapter = ? 
            ORDER BY v.verse ASC
        ");
        $stmt->execute([$version, $bookId, $chapter]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $verses = [];
        foreach ($rows as $row) {
            if (!empty($row['translated_text'])) {
                $row['text'] = $row['translated_text']; // Override base text with translated text
            }
            unset($row['translated_text']); // Clean up response
            $verses[] = $row;
        }
    }
    
    echo json_encode(["success" => true, "data" => $verses]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
