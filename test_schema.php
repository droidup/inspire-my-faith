<?php
require_once 'db.php';
try {
    $stmt = $pdo->prepare("DESCRIBE user_faith_verses");
    $stmt->execute();
    print_r($stmt->fetchAll());
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
