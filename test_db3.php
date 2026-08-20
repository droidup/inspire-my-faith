<?php
require_once 'db.php';
try {
    $stmt = $pdo->prepare("SELECT id, saved_at, FROM_UNIXTIME(saved_at/1000) as date_saved FROM user_faith_verses ORDER BY saved_at DESC LIMIT 10");
    $stmt->execute();
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
