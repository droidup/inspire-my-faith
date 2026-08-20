<?php
require_once 'cors.php';
require_once '../db.php';

$input = json_decode(file_get_contents('php://input'), true);

$user_id = isset($input['userId']) ? $input['userId'] : null;
$verse = isset($input['verse']) ? $input['verse'] : null;
$source_section = isset($input['sourceSection']) ? $input['sourceSection'] : 'faith_verses';

if (!$user_id || !$verse) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing userId or verse data"]);
    exit();
}

try {
    $pdo->beginTransaction();

    // Insert or update verse
    $stmt = $pdo->prepare("
        INSERT INTO user_faith_verses 
        (id, user_id, book_name, chapter, verse_num, text, version, note, saved_at, is_pinned, is_memorized) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE text=VALUES(text), note=VALUES(note), is_pinned=VALUES(is_pinned), is_memorized=VALUES(is_memorized)
    ");
    
    $verse_id = $verse['id'];
    $bookName = $verse['bookName'];
    $chapter = $verse['chapter'];
    $verseNum = $verse['verseNum'];
    $text = $verse['text'];
    $version = isset($verse['version']) ? $verse['version'] : 'IMF';
    $note = isset($verse['note']) ? $verse['note'] : '';
    $savedAt = isset($verse['savedAt']) ? $verse['savedAt'] : time() * 1000;
    $isPinned = !empty($verse['isPinned']) ? 1 : 0;
    $isMemorized = !empty($verse['isMemorized']) ? 1 : 0;

    $stmt->execute([
        $verse_id, $user_id, $bookName, $chapter, $verseNum,
        $text, $version, $note, $savedAt, $isPinned, $isMemorized
    ]);

    // Update collections safely based on sourceSection
    if (isset($verse['collections']) && is_array($verse['collections'])) {
        $stmt = $pdo->prepare("SELECT collection_name FROM user_collection_settings WHERE user_id = ? AND section_type = ?");
        $stmt->execute([$user_id, $source_section]);
        $sectionCollections = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (count($sectionCollections) > 0) {
            $placeholders = implode(',', array_fill(0, count($sectionCollections), '?'));
            $delStmt = $pdo->prepare("DELETE FROM user_faith_verse_collections WHERE verse_id = ? AND collection_name IN ($placeholders)");
            $params = array_merge([$verse_id], $sectionCollections);
            $delStmt->execute($params);
        }

        if (count($verse['collections']) > 0) {
            $insSettingsStmt = $pdo->prepare("INSERT IGNORE INTO user_collection_settings (user_id, section_type, collection_name, color, is_pinned) VALUES (?, ?, ?, '#c2094c', 0)");
            $insStmt = $pdo->prepare("INSERT IGNORE INTO user_faith_verse_collections (verse_id, collection_name) VALUES (?, ?)");
            foreach ($verse['collections'] as $collection) {
                $insSettingsStmt->execute([$user_id, $source_section, $collection]);
                $insStmt->execute([$verse_id, $collection]);
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
