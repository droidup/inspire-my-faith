<?php
require_once 'db.php';
try {
    $stmt = $pdo->query("SHOW CREATE TABLE user_prayers");
    print_r($stmt->fetch(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
