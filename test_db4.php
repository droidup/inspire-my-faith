<?php
require_once 'db.php';
try {
    $stmt = $pdo->prepare("SELECT id, version FROM user_faith_verses WHERE id = 'test1'");
    $stmt->execute();
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
