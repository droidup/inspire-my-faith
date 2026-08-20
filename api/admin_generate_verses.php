<?php
require_once 'cors.php';
require_once '../db.php';
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $quantity = isset($data['quantity']) ? (int)$data['quantity'] : 1;
    $season = isset($data['season']) ? $data['season'] : '';
    $customTheme = isset($data['customTheme']) ? $data['customTheme'] : '';
    $apiKeyOverride = isset($data['apiKey']) ? $data['apiKey'] : '';
    
    $actualSeason = $season === 'other' ? $customTheme : $season;
    
    $prompt = "Generate exactly {$quantity} highly inspiring, hand-picked Bible verses that fit the theme/season: \"{$actualSeason}\". 
For each verse, provide the reference, the verse text, and a highly engaging \"Make it happen\" actionable reflection. 
The season_tag should be exactly \"{$actualSeason}\". Make sure each verse is completely unique.
Return ONLY a JSON array of objects. Do not include markdown formatting.
Each object must have these exactly keys: \"reference\", \"verse_text\", \"make_it_happen\", \"season_tag\"";

    $apiKey = !empty($apiKeyOverride) ? $apiKeyOverride : GEMINI_API_KEY;
    if ($apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Exception("Gemini API Key is not configured in config.php");
    }

    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}";
    $postData = [
        "contents" => [
            [
                "parts" => [
                    ["text" => $prompt]
                ]
            ]
        ],
        "generationConfig" => [
            "responseMimeType" => "application/json"
        ]
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 400) {
        throw new Exception("Gemini API Error (HTTP $httpCode): " . $response);
    }
    
    $result = json_decode($response, true);
    $rawText = isset($result['candidates'][0]['content']['parts'][0]['text']) ? $result['candidates'][0]['content']['parts'][0]['text'] : '[]';
    
    $verses = json_decode($rawText, true);
    
    if (!is_array($verses) || count($verses) === 0) {
        throw new Exception("Failed to parse generated verses or received empty result.");
    }
    
    // Insert into DB
    $sql = "INSERT INTO daily_inspiration (reference, verse_text, season_tag, make_it_happen) VALUES ";
    $insertValues = [];
    $params = [];
    
    foreach ($verses as $v) {
        $insertValues[] = "(?, ?, ?, ?)";
        $params[] = $v['reference'];
        $params[] = $v['verse_text'];
        $params[] = $v['season_tag'];
        $params[] = $v['make_it_happen'];
    }
    
    $sql .= implode(", ", $insertValues);
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(["success" => true, "count" => count($verses)]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
