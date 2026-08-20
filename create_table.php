<?php
require_once 'db.php';
try {
    $sql = "CREATE TABLE IF NOT EXISTS `soul_searches` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `user_id` varchar(128) DEFAULT NULL,
        `search_text` text DEFAULT NULL,
        `emotion` varchar(255) DEFAULT NULL,
        `generated_prayer` text DEFAULT NULL,
        `verses` text DEFAULT NULL,
        `created_at` timestamp NULL DEFAULT current_timestamp(),
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    $pdo->exec($sql);
    echo "Table created successfully!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
