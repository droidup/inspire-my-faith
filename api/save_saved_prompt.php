<?php
require_once 'cors.php';
require_once '../db.php';

$input = json_decode(file_get_contents('php://input'), true);

$user_id = isset($input['userId']) ? $input['userId'] : null;
$prompt = isset($input['prompt']) ? $input['prompt'] : null;
$source_section = isset($input['sourceSection']) ? $input['sourceSection'] : 'prompt';

if (!$user_id || !$prompt) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing userId or prompt data"]);
    exit();
}

try {
    $pdo->beginTransaction();

    $collectionsJson = json_encode(isset($prompt['collections']) ? $prompt['collections'] : []);
    $versesJson = json_encode(isset($prompt['verses']) ? $prompt['verses'] : []);

    $stmt = $pdo->prepare("
        INSERT INTO user_saved_prompts 
        (id, user_id, title, text, answered, timestamp, isPinned, reflection, collections, verses) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title=VALUES(title), text=VALUES(text), answered=VALUES(answered), timestamp=VALUES(timestamp), isPinned=VALUES(isPinned), reflection=VALUES(reflection), collections=VALUES(collections), verses=VALUES(verses)
    ");
    
    $prompt_id = $prompt['id'];
    $title = $prompt['title'];
    $text = $prompt['text'];
    $answered = !empty($prompt['answered']) ? 1 : 0;
    $timestamp = isset($prompt['timestamp']) ? $prompt['timestamp'] : time() * 1000;
    $isPinned = !empty($prompt['isPinned']) ? 1 : 0;
    $reflection = isset($prompt['reflection']) ? $prompt['reflection'] : null;

    $stmt->execute([
        $prompt_id, $user_id, $title, $text, $answered, $timestamp, $isPinned, $reflection, $collectionsJson, $versesJson
    ]);

    // Update mapping collections safely based on sourceSection
    if (isset($prompt['collections']) && is_array($prompt['collections'])) {
        $stmt = $pdo->prepare("SELECT collection_name FROM user_collection_settings WHERE user_id = ? AND section_type = ?");
        $stmt->execute([$user_id, $source_section]);
        $sectionCollections = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (count($sectionCollections) > 0) {
            $placeholders = implode(',', array_fill(0, count($sectionCollections), '?'));
            $delStmt = $pdo->prepare("DELETE FROM user_prompt_collections WHERE prompt_id = ? AND collection_name IN ($placeholders)");
            $params = array_merge([$prompt_id], $sectionCollections);
            $delStmt->execute($params);
        }

        if (count($prompt['collections']) > 0) {
            $insSettingsStmt = $pdo->prepare("INSERT IGNORE INTO user_collection_settings (user_id, section_type, collection_name, color, is_pinned) VALUES (?, ?, ?, '#c2094c', 0)");
            $insStmt = $pdo->prepare("INSERT IGNORE INTO user_prompt_collections (prompt_id, collection_name) VALUES (?, ?)");
            foreach ($prompt['collections'] as $collection) {
                $insSettingsStmt->execute([$user_id, $source_section, $collection]);
                $insStmt->execute([$prompt_id, $collection]);
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
