<?php
require_once 'db.php';
try {
    $stmt = $pdo->prepare("SELECT id FROM user_faith_verses WHERE id = 'd63615eb-1e52-4fef-96d6-ca026405cd86'");
    $stmt->execute();
    print_r($stmt->fetchAll());
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
