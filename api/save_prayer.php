<?php
require_once 'cors.php';
require_once '../db.php';

$input = json_decode(file_get_contents('php://input'), true);

$user_id = isset($input['userId']) ? $input['userId'] : null;
$prayer = isset($input['prayer']) ? $input['prayer'] : null;
$source_section = isset($input['sourceSection']) ? $input['sourceSection'] : 'prayer';

if (!$user_id || !$prayer) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing userId or prayer data"]);
    exit();
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO user_prayers 
        (id, user_id, title, text, answered, timestamp, is_pinned, reflection) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title=VALUES(title), text=VALUES(text), answered=VALUES(answered), timestamp=VALUES(timestamp), is_pinned=VALUES(is_pinned), reflection=VALUES(reflection)
    ");
    
    $prayer_id = $prayer['id'];
    $title = $prayer['title'];
    $text = $prayer['text'];
    $answered = !empty($prayer['answered']) ? 1 : 0;
    $timestamp = isset($prayer['timestamp']) ? $prayer['timestamp'] : time() * 1000;
    $isPinned = !empty($prayer['isPinned']) ? 1 : 0;
    $reflection = isset($prayer['reflection']) ? $prayer['reflection'] : '';

    $stmt->execute([
        $prayer_id, $user_id, $title, $text, $answered, $timestamp, $isPinned, $reflection
    ]);

    // Update collections safely based on sourceSection
    if (isset($prayer['collections']) && is_array($prayer['collections'])) {
        $stmt = $pdo->prepare("SELECT collection_name FROM user_collection_settings WHERE user_id = ? AND section_type = ?");
        $stmt->execute([$user_id, $source_section]);
        $sectionCollections = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (count($sectionCollections) > 0) {
            $placeholders = implode(',', array_fill(0, count($sectionCollections), '?'));
            $delStmt = $pdo->prepare("DELETE FROM user_prayer_collections WHERE prayer_id = ? AND collection_name IN ($placeholders)");
            $params = array_merge([$prayer_id], $sectionCollections);
            $delStmt->execute($params);
        }

        if (count($prayer['collections']) > 0) {
            $insSettingsStmt = $pdo->prepare("INSERT IGNORE INTO user_collection_settings (user_id, section_type, collection_name, color, is_pinned) VALUES (?, ?, ?, '#c2094c', 0)");
            $insStmt = $pdo->prepare("INSERT IGNORE INTO user_prayer_collections (prayer_id, collection_name) VALUES (?, ?)");
            foreach ($prayer['collections'] as $collection) {
                $insSettingsStmt->execute([$user_id, $source_section, $collection]);
                $insStmt->execute([$prayer_id, $collection]);
            }
        }
    }

    $pdo->commit();
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
