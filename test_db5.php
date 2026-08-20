<?php
require_once 'db.php';
try {
    $stmt = $pdo->prepare("SELECT * FROM user_faith_verse_collections WHERE verse_id = 'd63615eb-1e52-4fef-96d6-ca026405cd86'");
    $stmt->execute();
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
