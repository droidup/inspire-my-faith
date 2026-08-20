<?php
require_once 'cors.php';
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $user_id = isset($input['userId']) ? $input['userId'] : null;
    $section_type = isset($input['sectionType']) ? $input['sectionType'] : null;
    $collection_name = isset($input['collectionName']) ? $input['collectionName'] : null;
    $settings = isset($input['settings']) ? $input['settings'] : null;

    if (!$user_id || !$collection_name || !$section_type || !$settings) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required fields"]);
        exit();
    }

    try {
        $color = isset($settings['color']) ? $settings['color'] : '#c2094c';
        $icon = isset($settings['icon']) ? $settings['icon'] : 'FolderOpen';
        $description = isset($settings['description']) ? $settings['description'] : '';
        $is_pinned = !empty($settings['isPinned']) ? 1 : 0;

        $stmt = $pdo->prepare("INSERT INTO user_collection_settings (user_id, collection_name, section_type, color, icon, description, is_pinned) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE color = VALUES(color), icon = VALUES(icon), description = VALUES(description), is_pinned = VALUES(is_pinned)");
        $stmt->execute([$user_id, $collection_name, $section_type, $color, $icon, $description, $is_pinned]);
        
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $section_type = isset($_GET['sectionType']) ? $_GET['sectionType'] : null;
    $user_id = isset($_GET['userId']) ? $_GET['userId'] : null;

    if (!$user_id || !$section_type) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required fields"]);
        exit();
    }

    try {
        $stmt = $pdo->prepare("SELECT collection_name, color, icon, description, is_pinned, created_at FROM user_collection_settings WHERE user_id = ? AND section_type = ?");
        $stmt->execute([$user_id, $section_type]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['collection_name']] = [
                'color' => $row['color'],
                'icon' => $row['icon'] ?: 'FolderOpen',
                'description' => $row['description'] ?: '',
                'isPinned' => $row['is_pinned'] == 1,
                'createdAt' => $row['created_at']
            ];
        }

        echo json_encode(["success" => true, "data" => $settings]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}
?>
