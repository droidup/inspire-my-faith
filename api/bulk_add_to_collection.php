<?php
require_once 'cors.php';
require_once '../db.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $userId = isset($data['userId']) ? $data['userId'] : '';
    $collectionName = isset($data['collectionName']) ? $data['collectionName'] : '';
    $items = isset($data['items']) ? $data['items'] : [];

    if (!$userId || !$collectionName || empty($items)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing parameters"]);
        exit();
    }

    $pdo->beginTransaction();

    foreach ($items as $item) {
        $id = $item['id'];
        $type = $item['type'];

        if ($type === 'prayer') {
            $stmt = $pdo->prepare("INSERT IGNORE INTO user_prayer_collections (prayer_id, collection_name) VALUES (?, ?)");
            $stmt->execute([$id, $collectionName]);
        } else if ($type === 'note') {
            $stmt = $pdo->prepare("INSERT IGNORE INTO user_note_collections (note_id, collection_name) VALUES (?, ?)");
            $stmt->execute([$id, $collectionName]);
        } else if ($type === 'verse') {
            // Check if it's a faith verse
            $stmt = $pdo->prepare("SELECT id FROM user_faith_verses WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->fetch()) {
                $stmt2 = $pdo->prepare("INSERT IGNORE INTO user_faith_verse_collections (verse_id, collection_name) VALUES (?, ?)");
                $stmt2->execute([$id, $collectionName]);
            } else {
                // Otherwise it's a saved verse
                $stmt2 = $pdo->prepare("INSERT IGNORE INTO user_verse_collections (verse_id, collection_name) VALUES (?, ?)");
                $stmt2->execute([$id, $collectionName]);
            }
        } else if ($type === 'bookmark') {
            $stmt = $pdo->prepare("INSERT IGNORE INTO user_verse_collections (verse_id, collection_name) VALUES (?, ?)");
            $stmt->execute([$id, $collectionName]);
        } else if ($type === 'prompt') {
            $stmt = $pdo->prepare("INSERT IGNORE INTO user_prompt_collections (prompt_id, collection_name) VALUES (?, ?)");
            $stmt->execute([$id, $collectionName]);
        }
    }

    $pdo->commit();

    echo json_encode(["success" => true]);

} catch(Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
