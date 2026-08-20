<?php
require_once 'cors.php';
require_once '../db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $bookId = isset($_GET['bookId']) ? $_GET['bookId'] : '';
        $chapter = isset($_GET['chapter']) ? $_GET['chapter'] : '';
        $verseNum = isset($_GET['verseNum']) ? $_GET['verseNum'] : '';
        
        if (!$bookId || !$chapter || !$verseNum) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing parameters"]);
            exit();
        }
        
        $stmt = $pdo->prepare("SELECT id, text as base_text FROM verses WHERE book_id = ? AND chapter = ? AND verse = ?");
        $stmt->execute([$bookId, $chapter, $verseNum]);
        $verseRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($verseRows) === 0) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Verse not found"]);
            exit();
        }
        
        $verseId = $verseRows[0]['id'];
        $baseText = $verseRows[0]['base_text'];
        
        $stmt = $pdo->prepare("SELECT text FROM verse_translations WHERE verse_id = ? AND version = 'IMF'");
        $stmt->execute([$verseId]);
        $transRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $imfText = count($transRows) > 0 ? $transRows[0]['text'] : '';
        
        echo json_encode(["success" => true, "baseText" => $baseText, "imfText" => $imfText]);
        exit();
    }
    
    if ($method === 'PUT' || $method === 'POST') {
        // Handle both PUT and POST for easier frontend integration
        $data = json_decode(file_get_contents('php://input'), true);
        
        $bookId = isset($data['bookId']) ? $data['bookId'] : '';
        $chapter = isset($data['chapter']) ? $data['chapter'] : '';
        $verseNum = isset($data['verseNum']) ? $data['verseNum'] : '';
        $version = isset($data['version']) ? $data['version'] : '';
        $text = isset($data['text']) ? $data['text'] : '';
        $email = isset($data['email']) ? $data['email'] : '';
        
        if (!$email || !$bookId || !$chapter || !$verseNum || !$version || !$text) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing fields"]);
            exit();
        }
        
        if ($email !== 'daveward.us@gmail.com') {
            $stmt = $pdo->prepare("SELECT email FROM admin_users WHERE email = ?");
            $stmt->execute([$email]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (count($rows) === 0) {
                http_response_code(403);
                echo json_encode(["success" => false, "message" => "Unauthorized"]);
                exit();
            }
        }
        
        $stmt = $pdo->prepare("SELECT id FROM verses WHERE book_id = ? AND chapter = ? AND verse = ?");
        $stmt->execute([$bookId, $chapter, $verseNum]);
        $verseRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($verseRows) === 0) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Verse not found"]);
            exit();
        }
        
        $verseId = $verseRows[0]['id'];
        
        $sql = "INSERT INTO verse_translations (verse_id, version, text) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE text=VALUES(text)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$verseId, $version, $text]);
        
        echo json_encode(["success" => true]);
        exit();
    }
    
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
