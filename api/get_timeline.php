<?php
require_once 'cors.php';
require_once '../db.php';

$user_id = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing userId"]);
    exit();
}

try {
    // Prayers
    $stmt1 = $pdo->prepare("
        SELECT p.id, 'prayer' as type, p.title, p.text as description, p.timestamp, GROUP_CONCAT(pc.collection_name SEPARATOR '|||') as collections 
        FROM user_prayers p LEFT JOIN user_prayer_collections pc ON p.id = pc.prayer_id 
        WHERE p.user_id = ? GROUP BY p.id
    ");
    $stmt1->execute([$user_id]);
    $prayersRows = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    // Sermon Notes
    $stmt2 = $pdo->prepare("
        SELECT sn.id, 'note' as type, sn.title, sn.notes as description, sn.timestamp, GROUP_CONCAT(nc.collection_name SEPARATOR '|||') as collections 
        FROM user_sermon_notes sn LEFT JOIN user_note_collections nc ON sn.id = nc.note_id 
        WHERE sn.user_id = ? GROUP BY sn.id
    ");
    $stmt2->execute([$user_id]);
    $notesRows = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    // Faith Verses
    $stmt3 = $pdo->prepare("
        SELECT v.id, 'verse' as type, 'faith' as source, v.version, CONCAT(v.book_name, ' ', v.chapter, ':', v.verse_num) as title, v.text as description, v.note, v.saved_at as timestamp, GROUP_CONCAT(vc.collection_name SEPARATOR '|||') as collections 
        FROM user_faith_verses v LEFT JOIN user_faith_verse_collections vc ON v.id = vc.verse_id 
        WHERE v.user_id = ? GROUP BY v.id
    ");
    $stmt3->execute([$user_id]);
    $versesRows = $stmt3->fetchAll(PDO::FETCH_ASSOC);

    // Saved Verses (Faith Guide)
    $stmt7 = $pdo->prepare("
        SELECT v.id, 'verse' as type, 'saved' as source, v.version, CONCAT(v.book_name, ' ', v.chapter, ':', v.verse_num) as title, v.text as description, v.note, v.saved_at as timestamp, GROUP_CONCAT(vc.collection_name SEPARATOR '|||') as collections 
        FROM user_saved_verses v LEFT JOIN user_verse_collections vc ON v.id = vc.verse_id 
        WHERE v.user_id = ? GROUP BY v.id
    ");
    $stmt7->execute([$user_id]);
    $savedVersesRows = $stmt7->fetchAll(PDO::FETCH_ASSOC);

    // Bookmarks
    $stmt4 = $pdo->prepare("
        SELECT b.id, 'bookmark' as type, CONCAT(b.book_name, ' ', b.chapter, ':', b.verse_num) as title, b.text as description, b.timestamp, GROUP_CONCAT(vc.collection_name SEPARATOR '|||') as collections 
        FROM user_bookmarks b LEFT JOIN user_verse_collections vc ON b.id = vc.verse_id 
        WHERE b.user_id = ? GROUP BY b.id
    ");
    $stmt4->execute([$user_id]);
    $bookmarksRows = $stmt4->fetchAll(PDO::FETCH_ASSOC);

    // Faith Events
    $stmt5 = $pdo->prepare("
        SELECT id, event_type as type, title, description, timestamp 
        FROM user_faith_events 
        WHERE user_id = ?
    ");
    $stmt5->execute([$user_id]);
    $eventsRows = $stmt5->fetchAll(PDO::FETCH_ASSOC);

    // Saved Prompts
    $stmt6 = $pdo->prepare("
        SELECT p.id, 'prompt' as type, p.title, p.text as description, p.timestamp, GROUP_CONCAT(pc.collection_name SEPARATOR '|||') as collections 
        FROM user_saved_prompts p LEFT JOIN user_prompt_collections pc ON p.id = pc.prompt_id 
        WHERE p.user_id = ? GROUP BY p.id
    ");
    $stmt6->execute([$user_id]);
    $promptsRows = $stmt6->fetchAll(PDO::FETCH_ASSOC);

    function formatRow($row) {
        if (isset($row['collections']) && $row['collections']) {
            $row['collections'] = explode('|||', $row['collections']);
        } else {
            $row['collections'] = [];
        }
        
        // Ensure timestamp is parsed as integer
        if (isset($row['timestamp'])) {
            $row['timestamp'] = (int)$row['timestamp'];
        }
        
        return $row;
    }

    $all_events = array_merge(
        array_map('formatRow', $prayersRows),
        array_map('formatRow', $notesRows),
        array_map('formatRow', $versesRows),
        array_map('formatRow', $savedVersesRows),
        array_map('formatRow', $bookmarksRows),
        array_map('formatRow', $eventsRows),
        array_map('formatRow', $promptsRows)
    );

    // Sort by timestamp descending
    usort($all_events, function($a, $b) {
        return $b['timestamp'] - $a['timestamp'];
    });

    echo json_encode(["success" => true, "data" => $all_events]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
