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
    
    $bookId = isset($data['bookId']) ? $data['bookId'] : '';
    $chapter = isset($data['chapter']) ? $data['chapter'] : '';
    
    if (!$bookId || !$chapter) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing parameters"]);
        exit();
    }
    
    // Wipe existing translations for this chapter
    $stmt = $pdo->prepare("DELETE FROM verse_translations WHERE version = 'IMF' AND verse_id IN (SELECT id FROM verses WHERE book_id = ? AND chapter = ?)");
    $stmt->execute([$bookId, $chapter]);
    
    // Get Book Name
    $stmt = $pdo->prepare("SELECT name FROM books WHERE id = ?");
    $stmt->execute([$bookId]);
    $bookRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$bookRow) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Book not found"]);
        exit();
    }
    $bookName = $bookRow['name'];
    
    // Fetch verses for this chapter
    $stmt = $pdo->prepare("SELECT * FROM verses WHERE book_id = ? AND chapter = ? ORDER BY verse ASC");
    $stmt->execute([$bookId, $chapter]);
    $missingVerses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($missingVerses) === 0) {
        echo json_encode(["success" => true, "message" => "No verses to translate"]);
        exit();
    }
    
    // Fetch chapter summary
    $stmt = $pdo->prepare("SELECT summary FROM chapter_summaries WHERE book_id = ? AND chapter = ?");
    $stmt->execute([$bookId, $chapter]);
    $summaryRow = $stmt->fetch(PDO::FETCH_ASSOC);
    $summary = $summaryRow ? $summaryRow['summary'] : 'No summary available.';
    
    $verseListStr = "";
    foreach ($missingVerses as $v) {
        $verseListStr .= "{$bookName} {$chapter}:{$v['verse']} ({$v['text']})\n";
    }
    
    $prompt = "You are translating Bible verses into a modern, novel-like narrative style, as part of the 'Inspire My Faith' (IMF) version. Make it engaging, relatable, and use United States English.
Here is the chapter summary to guide the context:
{$summary}

Translate the following Berean Standard Bible (BSB) verses:
{$verseListStr}

Return ONLY a JSON array of strings containing just the verse text, in the exact same order. Do not include markdown blocks. Example: [\"Verse 1 text\", \"Verse 2 text\"]";

    // Call Gemini API (use flash for faster bulk generation)
    // We append the instruction to return JSON Array
    $apiKey = GEMINI_API_KEY;
    if ($apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Exception("Gemini API Key is not configured in config.php");
    }

    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={$apiKey}";
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
    
    $translatedTexts = json_decode($rawText, true);
    
    if (!is_array($translatedTexts) || count($translatedTexts) !== count($missingVerses)) {
        throw new Exception("Gemini API returned an invalid array length or invalid JSON. Expected " . count($missingVerses) . " items, got " . (is_array($translatedTexts) ? count($translatedTexts) : 'invalid json') . ". Raw: " . $rawText);
    }
    
    // Insert translations
    $sql = "INSERT INTO verse_translations (verse_id, version, text) VALUES ";
    $insertValues = [];
    $params = [];
    
    foreach ($missingVerses as $i => $v) {
        $insertValues[] = "(?, ?, ?)";
        $params[] = $v['id'];
        $params[] = 'IMF';
        $params[] = $translatedTexts[$i];
    }
    
    $sql .= implode(", ", $insertValues);
    $sql .= " ON DUPLICATE KEY UPDATE text=VALUES(text)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(["success" => true, "message" => "Chapter built successfully!"]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
