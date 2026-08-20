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
        
        $stmt = $pdo->prepare("SELECT * FROM user_faith_events WHERE user_id = ? ORDER BY timestamp DESC");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $events = [];
        foreach ($rows as $row) {
            $events[] = [
                'id' => $row['id'],
                'eventType' => $row['event_type'],
                'title' => $row['title'],
                'description' => $row['description'],
                'timestamp' => (int)$row['timestamp']
            ];
        }
        
        echo json_encode(["success" => true, "data" => $events]);
        exit();
    }
    
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = isset($data['userId']) ? $data['userId'] : '';
        $event = isset($data['event']) ? $data['event'] : null;
        
        if (!$userId || !$event) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing userId or event"]);
            exit();
        }
        
        $id = $event['id'];
        $eventType = $event['eventType'];
        $title = $event['title'];
        $description = isset($event['description']) ? $event['description'] : '';
        $timestamp = isset($event['timestamp']) ? $event['timestamp'] : round(microtime(true) * 1000);
        
        $sql = "INSERT INTO user_faith_events (id, user_id, event_type, title, description, timestamp) 
                VALUES (?, ?, ?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), timestamp=VALUES(timestamp)";
                
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id, $userId, $eventType, $title, $description, $timestamp]);
        
        echo json_encode(["success" => true]);
        exit();
    }
    
    if ($method === 'DELETE') {
        $eventId = isset($_GET['eventId']) ? $_GET['eventId'] : '';
        $userId = isset($_GET['userId']) ? $_GET['userId'] : '';
        
        if (!$eventId || !$userId) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing eventId or userId"]);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM user_faith_events WHERE id = ? AND user_id = ?");
        $stmt->execute([$eventId, $userId]);
        
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
