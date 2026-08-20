<?php
require_once 'cors.php';
require_once '../db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT email, created_at FROM admin_users ORDER BY created_at ASC");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "data" => $users]);
        exit();
    }
    
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $email = isset($data['email']) ? $data['email'] : '';
        $reqEmail = isset($data['reqEmail']) ? $data['reqEmail'] : '';
        
        if (!$email || !$reqEmail) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing email"]);
            exit();
        }
        
        if ($reqEmail !== 'daveward.us@gmail.com') {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Only daveward.us@gmail.com can add admins."]);
            exit();
        }
        
        $stmt = $pdo->prepare("INSERT IGNORE INTO admin_users (email) VALUES (?)");
        $stmt->execute([$email]);
        echo json_encode(["success" => true]);
        exit();
    }
    
    if ($method === 'DELETE') {
        // DELETE requests in PHP usually need careful parsing of query params
        $email = isset($_GET['email']) ? $_GET['email'] : '';
        $reqEmail = isset($_GET['reqEmail']) ? $_GET['reqEmail'] : '';
        
        if (!$email || !$reqEmail) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing email or requester email"]);
            exit();
        }
        
        if ($reqEmail !== 'daveward.us@gmail.com') {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Only daveward.us@gmail.com can delete admins."]);
            exit();
        }
        
        if ($email === 'daveward.us@gmail.com') {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Cannot delete super admin."]);
            exit();
        }
        
        $stmt = $pdo->prepare("DELETE FROM admin_users WHERE email = ?");
        $stmt->execute([$email]);
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
