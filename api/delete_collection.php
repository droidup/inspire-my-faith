<?php
require_once 'cors.php';
require_once '../db.php';

$input = json_decode(file_get_contents('php://input'), true);

$user_id = isset($input['userId']) ? $input['userId'] : null;
$section_type = isset($input['sectionType']) ? $input['sectionType'] : null;
$collection_name = isset($input['collectionName']) ? $input['collectionName'] : null;

if (!$user_id || !$collection_name || !$section_type) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit();
}

try {
    $pdo->beginTransaction();

    $stmt1 = $pdo->prepare("DELETE FROM user_collection_settings WHERE collection_name = ? AND user_id = ? AND section_type = ?");
    $stmt1->execute([$collection_name, $user_id, $section_type]);

    if ($section_type === 'verse') {
        $stmt2 = $pdo->prepare("DELETE FROM user_verse_collections WHERE collection_name = ? AND user_id = ?");
        $stmt2->execute([$collection_name, $user_id]);
    } else if ($section_type === 'prayer') {
        $stmt2 = $pdo->prepare("DELETE upc FROM user_prayer_collections upc JOIN user_prayers up ON upc.prayer_id = up.id WHERE upc.collection_name = ? AND up.user_id = ?");
        $stmt2->execute([$collection_name, $user_id]);
    } else if ($section_type === 'note') {
        $stmt2 = $pdo->prepare("DELETE unc FROM user_note_collections unc JOIN user_sermon_notes usn ON unc.note_id = usn.id WHERE unc.collection_name = ? AND usn.user_id = ?");
        $stmt2->execute([$collection_name, $user_id]);
    } else if ($section_type === 'prompt') {
        $stmt2 = $pdo->prepare("DELETE upc FROM user_prompt_collections upc JOIN user_saved_prompts usp ON upc.prompt_id = usp.id WHERE upc.collection_name = ? AND usp.user_id = ?");
        $stmt2->execute([$collection_name, $user_id]);
    } else if ($section_type === 'faith_verses') {
        $stmt2 = $pdo->prepare("DELETE ufvc FROM user_faith_verse_collections ufvc JOIN user_faith_verses ufv ON ufvc.verse_id = ufv.id WHERE ufvc.collection_name = ? AND ufv.user_id = ?");
        $stmt2->execute([$collection_name, $user_id]);
    } else if ($section_type === 'timeline') {
        // Delete across ALL event types for this user
        $s1 = $pdo->prepare("DELETE FROM user_verse_collections WHERE collection_name = ? AND user_id = ?");
        $s1->execute([$collection_name, $user_id]);
        
        $s2 = $pdo->prepare("DELETE upc FROM user_prayer_collections upc JOIN user_prayers up ON upc.prayer_id = up.id WHERE upc.collection_name = ? AND up.user_id = ?");
        $s2->execute([$collection_name, $user_id]);
        
        $s3 = $pdo->prepare("DELETE unc FROM user_note_collections unc JOIN user_sermon_notes usn ON unc.note_id = usn.id WHERE unc.collection_name = ? AND usn.user_id = ?");
        $s3->execute([$collection_name, $user_id]);
        
        $s4 = $pdo->prepare("DELETE upc FROM user_prompt_collections upc JOIN user_saved_prompts usp ON upc.prompt_id = usp.id WHERE upc.collection_name = ? AND usp.user_id = ?");
        $s4->execute([$collection_name, $user_id]);
        
        $s5 = $pdo->prepare("DELETE ufvc FROM user_faith_verse_collections ufvc JOIN user_faith_verses ufv ON ufvc.verse_id = ufv.id WHERE ufvc.collection_name = ? AND ufv.user_id = ?");
        $s5->execute([$collection_name, $user_id]);
    }

    $pdo->commit();
    echo json_encode(["success" => true]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
