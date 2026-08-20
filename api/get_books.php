<?php
require_once 'cors.php';
require_once '../db.php';

try {
    $stmt = $pdo->prepare("
        SELECT 
          b.*,
          COUNT(v.id) as total_verses,
          COUNT(vt.verse_id) as imf_verses
        FROM books b
        LEFT JOIN verses v ON b.id = v.book_id
        LEFT JOIN verse_translations vt ON v.id = vt.verse_id AND vt.version = 'IMF'
        GROUP BY b.id
        ORDER BY b.book_order ASC
    ");
    $stmt->execute();
    $books = $stmt->fetchAll();
    
    // Process booleans and integers
    foreach ($books as &$book) {
        $book['total_verses'] = (int)$book['total_verses'];
        $book['imf_verses'] = (int)$book['imf_verses'];
        $book['completed'] = ($book['total_verses'] > 0 && $book['total_verses'] === $book['imf_verses']);
    }
    
    echo json_encode(["success" => true, "data" => $books]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to fetch books: " . $e->getMessage()]);
}
?>
