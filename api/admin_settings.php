<?php
require_once 'cors.php';
require_once '../db.php';
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    // Ensure table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS site_settings (
            setting_key VARCHAR(50) PRIMARY KEY,
            setting_value VARCHAR(255) NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
    
    // Ensure default setting exists
    $pdo->exec("INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('ads_enabled', 'false')");

    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM site_settings");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        
        echo json_encode(["success" => true, "data" => $settings]);
        exit();
    }
    
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $email = isset($data['email']) ? $data['email'] : '';
        if ($email !== 'daveward.us@gmail.com') {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Unauthorized"]);
            exit();
        }
        
        $settingKey = isset($data['key']) ? $data['key'] : '';
        $settingValue = isset($data['value']) ? $data['value'] : '';
        
        if (!$settingKey) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing key"]);
            exit();
        }
        
        $stmt = $pdo->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
        $stmt->execute([$settingKey, $settingValue]);
        
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
