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
        
        $sql = "
          SELECT p.*, GROUP_CONCAT(pc.collection_name SEPARATOR '|||') as collections
          FROM user_prayers p
          LEFT JOIN user_prayer_collections pc ON p.id = pc.prayer_id
          WHERE p.user_id = ?
          GROUP BY p.id
          ORDER BY p.is_pinned DESC, p.timestamp DESC
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $prayers = [];
        foreach ($rows as $row) {
            $prayers[] = [
                'id' => $row['id'],
                'title' => $row['title'],
                'text' => $row['text'],
                'answered' => $row['answered'] == 1,
                'timestamp' => (int)$row['timestamp'],
                'isPinned' => $row['is_pinned'] == 1,
                'reflection' => $row['reflection'] ? $row['reflection'] : '',
                'collections' => $row['collections'] ? explode('|||', $row['collections']) : []
            ];
        }
        
        echo json_encode(["success" => true, "data" => $prayers]);
        exit();
    }
    
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = isset($data['userId']) ? $data['userId'] : '';
        $prayer = isset($data['prayer']) ? $data['prayer'] : null;
        
        if (!$userId || !$prayer) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing userId or prayer"]);
            exit();
        }
        
        $pdo->beginTransaction();
        
        try {
            $id = $prayer['id'];
            $title = $prayer['title'];
            $text = $prayer['text'];
            $answered = isset($prayer['answered']) && $prayer['answered'] ? 1 : 0;
            $timestamp = isset($prayer['timestamp']) ? $prayer['timestamp'] : round(microtime(true) * 1000);
            $isPinned = isset($prayer['isPinned']) && $prayer['isPinned'] ? 1 : 0;
            $reflection = isset($prayer['reflection']) ? $prayer['reflection'] : '';
            
            $sql = "INSERT INTO user_prayers (id, user_id, title, text, answered, timestamp, is_pinned, reflection) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
                    ON DUPLICATE KEY UPDATE title=VALUES(title), text=VALUES(text), answered=VALUES(answered), 
                    timestamp=VALUES(timestamp), is_pinned=VALUES(is_pinned), reflection=VALUES(reflection)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id, $userId, $title, $text, $answered, $timestamp, $isPinned, $reflection]);
            
            // Delete old collections
            $delStmt = $pdo->prepare("DELETE FROM user_prayer_collections WHERE prayer_id = ?");
            $delStmt->execute([$id]);
            
            // Insert new collections
            if (isset($prayer['collections']) && is_array($prayer['collections']) && count($prayer['collections']) > 0) {
                $colSql = "INSERT INTO user_prayer_collections (prayer_id, collection_name) VALUES ";
                $colValues = [];
                $params = [];
                foreach ($prayer['collections'] as $c) {
                    $colValues[] = "(?, ?)";
                    $params[] = $id;
                    $params[] = $c;
                }
                $colSql .= implode(", ", $colValues);
                $colStmt = $pdo->prepare($colSql);
                $colStmt->execute($params);
            }
            
            $pdo->commit();
            echo json_encode(["success" => true]);
        } catch(Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        exit();
    }
    
    if ($method === 'DELETE') {
        $prayerId = isset($_GET['prayerId']) ? $_GET['prayerId'] : '';
        $userId = isset($_GET['userId']) ? $_GET['userId'] : '';
        
        if (!$prayerId || !$userId) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing prayerId or userId"]);
            exit();
        }
        
        $pdo->beginTransaction();
        
        try {
            $stmt = $pdo->prepare("DELETE FROM user_prayers WHERE id = ? AND user_id = ?");
            $stmt->execute([$prayerId, $userId]);
            
            $delStmt = $pdo->prepare("DELETE FROM user_prayer_collections WHERE prayer_id = ?");
            $delStmt->execute([$prayerId]);
            
            $pdo->commit();
            echo json_encode(["success" => true]);
        } catch(Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
        exit();
    }
    
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
