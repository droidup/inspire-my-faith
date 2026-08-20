<?php
require_once 'cors.php';
require_once '../db.php';

try {
    $email = isset($_GET['email']) ? $_GET['email'] : '';
    
    if (!$email) {
        echo json_encode(["success" => false, "isAdmin" => false, "isSuperAdmin" => false]);
        exit();
    }
    
    if ($email === 'daveward.us@gmail.com') {
        echo json_encode(["success" => true, "isAdmin" => true, "isSuperAdmin" => true]);
        exit();
    }
    
    $stmt = $pdo->prepare("SELECT email FROM admin_users WHERE email = ?");
    $stmt->execute([$email]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($rows) > 0) {
        echo json_encode(["success" => true, "isAdmin" => true, "isSuperAdmin" => false]);
    } else {
        echo json_encode(["success" => true, "isAdmin" => false, "isSuperAdmin" => false]);
    }
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "isAdmin" => false, "message" => $e->getMessage()]);
}
?>
