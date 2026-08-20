<?php
require_once 'db.php';
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'soul_searches'");
    print_r($stmt->fetchAll());
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
