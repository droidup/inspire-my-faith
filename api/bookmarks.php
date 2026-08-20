<?php
require_once 'cors.php';
require_once '../db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $userId = isset($_GET['userId']) ? $_GET['userId'] : '';
        if (!$userId) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing userId"]);
            exit();
        }
        
        $stmt = $pdo->prepare("SELECT * FROM user_bookmarks WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $bookmarks = [];
        foreach ($rows as $row) {
            $bookmarks[] = [
                'id' => $row['id'],
                'bookName' => $row['book_name'],
                'chapter' => (int)$row['chapter'],
                'verseNum' => (int)$row['verse_num'],
                'text' => $row['text'],
                'version' => $row['version'],
                'timestamp' => (int)$row['timestamp']
            ];
        }
        
        echo json_encode(["success" => true, "data" => $bookmarks]);
        exit();
    }
    
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = isset($data['userId']) ? $data['userId'] : '';
        $bookmark = isset($data['bookmark']) ? $data['bookmark'] : null;
        
        if (!$userId || !$bookmark) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing userId or bookmark"]);
            exit();
        }
        
        $id = $bookmark['id'];
        $bookName = $bookmark['bookName'];
        $chapter = $bookmark['chapter'];
        $verseNum = $bookmark['verseNum'];
        $text = $bookmark['text'];
        $version = $bookmark['version'];
        $timestamp = isset($bookmark['timestamp']) ? $bookmark['timestamp'] : round(microtime(true) * 1000);
        
        $sql = "INSERT INTO user_bookmarks 
                (id, user_id, book_name, chapter, verse_num, text, version, timestamp) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE timestamp=VALUES(timestamp)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id, $userId, $bookName, $chapter, $verseNum, $text, $version, $timestamp]);
        
        // Delete older bookmarks beyond the top 5
        $sqlDelete = "DELETE FROM user_bookmarks 
                      WHERE user_id = ? 
                      AND id NOT IN (
                          SELECT id FROM (
                              SELECT id FROM user_bookmarks 
                              WHERE user_id = ? 
                              ORDER BY timestamp DESC 
                              LIMIT 5
                          ) as subquery
                      )";
        $stmtDel = $pdo->prepare($sqlDelete);
        $stmtDel->execute([$userId, $userId]);
        
        echo json_encode(["success" => true]);
        exit();
    }
    
    if ($method === 'DELETE') {
        $verseId = isset($_GET['verseId']) ? $_GET['verseId'] : '';
        $userId = isset($_GET['userId']) ? $_GET['userId'] : '';
        
        if (!$verseId || !$userId) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing verseId or userId"]);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM user_bookmarks WHERE id = ? AND user_id = ?");
        $stmt->execute([$verseId, $userId]);
        
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
