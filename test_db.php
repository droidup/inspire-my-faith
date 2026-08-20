<?php
require_once 'db.php';
try {
    $stmt = $pdo->prepare("SELECT * FROM user_faith_verse_collections LIMIT 5");
    $stmt->execute();
    print_r($stmt->fetchAll());
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
