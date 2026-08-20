<?php
require_once 'db.php';
try {
    $stmt = $pdo->query("SHOW TABLES LIKE '%collections'");
    print_r($stmt->fetchAll(PDO::FETCH_COLUMN));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
