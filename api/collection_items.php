<?php
require_once 'cors.php';
require_once '../db.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

try {
    $sectionType = isset($_GET['sectionType']) ? $_GET['sectionType'] : '';
    $collectionName = isset($_GET['collectionName']) ? $_GET['collectionName'] : '';
    $userId = isset($_GET['userId']) ? $_GET['userId'] : '';

    if (!$sectionType || !$collectionName || !$userId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing parameters"]);
        exit();
    }

    $items = [];

    // Prayers
    $stmt = $pdo->prepare("
        SELECT upc.prayer_id as id, 'prayer' as type 
        FROM user_prayer_collections upc 
        JOIN user_prayers up ON upc.prayer_id = up.id 
        WHERE upc.collection_name = ? AND up.user_id = ?
    ");
    $stmt->execute([$collectionName, $userId]);
    $items = array_merge($items, $stmt->fetchAll(PDO::FETCH_ASSOC));

    // Notes
    $stmt = $pdo->prepare("
        SELECT unc.note_id as id, 'note' as type 
        FROM user_note_collections unc 
        JOIN user_sermon_notes sn ON unc.note_id = sn.id 
        WHERE unc.collection_name = ? AND sn.user_id = ?
    ");
    $stmt->execute([$collectionName, $userId]);
    $items = array_merge($items, $stmt->fetchAll(PDO::FETCH_ASSOC));

    // Verses
    if ($sectionType === 'faith_verses' || $sectionType === 'timeline') {
        $stmt = $pdo->prepare("
            SELECT uvc.verse_id as id, 'verse' as type 
            FROM user_faith_verse_collections uvc
            JOIN user_faith_verses usv ON uvc.verse_id = usv.id
            WHERE uvc.collection_name = ? AND usv.user_id = ?
        ");
        $stmt->execute([$collectionName, $userId]);
        $items = array_merge($items, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($sectionType !== 'faith_verses') {
        $stmt = $pdo->prepare("
            SELECT uvc.verse_id as id, 'verse' as type 
            FROM user_verse_collections uvc
            JOIN user_saved_verses usv ON uvc.verse_id = usv.id
            WHERE uvc.collection_name = ? AND usv.user_id = ?
        ");
        $stmt->execute([$collectionName, $userId]);
        $items = array_merge($items, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Bookmarks
    $stmt = $pdo->prepare("
        SELECT uvc.verse_id as id, 'bookmark' as type 
        FROM user_verse_collections uvc
        JOIN user_bookmarks ub ON uvc.verse_id = ub.id
        WHERE uvc.collection_name = ? AND ub.user_id = ?
    ");
    $stmt->execute([$collectionName, $userId]);
    $items = array_merge($items, $stmt->fetchAll(PDO::FETCH_ASSOC));

    // Prompts
    $stmt = $pdo->prepare("
        SELECT upc.prompt_id as id, 'prompt' as type 
        FROM user_prompt_collections upc
        JOIN user_saved_prompts usp ON upc.prompt_id = usp.id
        WHERE upc.collection_name = ? AND usp.user_id = ?
    ");
    $stmt->execute([$collectionName, $userId]);
    $items = array_merge($items, $stmt->fetchAll(PDO::FETCH_ASSOC));

    echo json_encode(["success" => true, "data" => $items]);

} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
