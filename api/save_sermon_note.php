<?php
require_once 'cors.php';
require_once '../db.php';

$input = json_decode(file_get_contents('php://input'), true);

$user_id = isset($input['userId']) ? $input['userId'] : null;
$note = isset($input['note']) ? $input['note'] : null;
$source_section = isset($input['sourceSection']) ? $input['sourceSection'] : 'note';

if (!$user_id || !$note) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing userId or note data"]);
    exit();
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO user_sermon_notes 
        (id, user_id, title, speaker, date, notes, timestamp, is_pinned) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title=VALUES(title), speaker=VALUES(speaker), date=VALUES(date), notes=VALUES(notes), timestamp=VALUES(timestamp), is_pinned=VALUES(is_pinned)
    ");
    
    $note_id = $note['id'];
    $title = $note['title'];
    $speaker = $note['speaker'];
    $date = $note['date'];
    $text = isset($note['text']) ? $note['text'] : (isset($note['notes']) ? $note['notes'] : '');
    $timestamp = isset($note['timestamp']) ? $note['timestamp'] : time() * 1000;
    $isPinned = !empty($note['isPinned']) ? 1 : 0;

    $stmt->execute([
        $note_id, $user_id, $title, $speaker, $date, $text, $timestamp, $isPinned
    ]);

    // Update collections safely based on sourceSection
    if (isset($note['collections']) && is_array($note['collections'])) {
        $stmt = $pdo->prepare("SELECT collection_name FROM user_collection_settings WHERE user_id = ? AND section_type = ?");
        $stmt->execute([$user_id, $source_section]);
        $sectionCollections = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (count($sectionCollections) > 0) {
            $placeholders = implode(',', array_fill(0, count($sectionCollections), '?'));
            $delStmt = $pdo->prepare("DELETE FROM user_note_collections WHERE note_id = ? AND collection_name IN ($placeholders)");
            $params = array_merge([$note_id], $sectionCollections);
            $delStmt->execute($params);
        }

        if (count($note['collections']) > 0) {
            $insSettingsStmt = $pdo->prepare("INSERT IGNORE INTO user_collection_settings (user_id, section_type, collection_name, color, is_pinned) VALUES (?, ?, ?, '#c2094c', 0)");
            $insStmt = $pdo->prepare("INSERT IGNORE INTO user_note_collections (note_id, collection_name) VALUES (?, ?)");
            foreach ($note['collections'] as $collection) {
                $insSettingsStmt->execute([$user_id, $source_section, $collection]);
                $insStmt->execute([$note_id, $collection]);
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
