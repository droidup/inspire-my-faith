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
        
        $stmt = $pdo->prepare("SELECT * FROM user_reading_plans WHERE user_id = ?");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $plans = [];
        foreach ($rows as $row) {
            $plans[] = [
                'id' => $row['id'],
                'planName' => $row['plan_name'],
                'progress' => (int)$row['progress'],
                'totalDays' => (int)$row['total_days'],
                'lastReadTimestamp' => (int)$row['last_read_timestamp'],
                'streak' => (int)$row['streak']
            ];
        }
        
        echo json_encode(["success" => true, "data" => $plans]);
        exit();
    }
    
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = isset($data['userId']) ? $data['userId'] : '';
        $plan = isset($data['plan']) ? $data['plan'] : null;
        
        if (!$userId || !$plan) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing userId or plan"]);
            exit();
        }
        
        $id = $plan['id'];
        $planName = $plan['planName'];
        $progress = $plan['progress'];
        $totalDays = $plan['totalDays'];
        $lastReadTimestamp = $plan['lastReadTimestamp'];
        $streak = $plan['streak'];
        
        $sql = "INSERT INTO user_reading_plans (id, user_id, plan_name, progress, total_days, last_read_timestamp, streak) 
                VALUES (?, ?, ?, ?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE progress=VALUES(progress), 
                last_read_timestamp=VALUES(last_read_timestamp), streak=VALUES(streak)";
                
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id, $userId, $planName, $progress, $totalDays, $lastReadTimestamp, $streak]);
        
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
