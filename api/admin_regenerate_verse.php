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
    $verseNum = isset($data['verseNum']) ? $data['verseNum'] : '';
    
    if (!$bookId || !$chapter || !$verseNum) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing parameters"]);
        exit();
    }
    
    $prev = (int)$verseNum - 1;
    $next = (int)$verseNum + 1;
    
    $sql = "SELECT v.verse, v.text as base_text, vt.text as imf_text 
            FROM verses v 
            LEFT JOIN verse_translations vt ON v.id = vt.verse_id AND vt.version = 'IMF'
            WHERE v.book_id = ? AND v.chapter = ? AND v.verse IN (?, ?, ?) 
            ORDER BY v.verse ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$bookId, $chapter, $prev, $verseNum, $next]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $targetVerse = null;
    $prevVerse = null;
    $nextVerse = null;
    
    foreach ($rows as $row) {
        if ($row['verse'] == $verseNum) $targetVerse = $row;
        if ($row['verse'] == $prev) $prevVerse = $row;
        if ($row['verse'] == $next) $nextVerse = $row;
    }
    
    if (!$targetVerse) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Verse not found"]);
        exit();
    }
    
    $contextStr = "";
    if ($prevVerse) {
        $text = !empty($prevVerse['imf_text']) ? $prevVerse['imf_text'] : $prevVerse['base_text'];
        $contextStr .= "Previous Verse ({$prevVerse['verse']}): {$text}\n";
    }
    $contextStr .= "Target Verse ({$targetVerse['verse']}): {$targetVerse['base_text']}\n";
    if ($nextVerse) {
        $text = !empty($nextVerse['imf_text']) ? $nextVerse['imf_text'] : $nextVerse['base_text'];
        $contextStr .= "Next Verse ({$nextVerse['verse']}): {$text}\n";
    }
    
    $prompt = "You are translating the Bible into the \"Inspire My Faith Modern Version\".
This translation should be easily readable for modern readers, utilizing contemporary English without compromising the theological depth or core meaning. Ensure the tone remains reverent and deeply engaging.

Here are some surrounding verses for context so that your translation flows naturally and matches the writing style:
{$contextStr}

Please translate the Target Verse ({$targetVerse['verse']}) into the Inspire My Faith Modern Version style.
Provide ONLY the translated text for the Target Verse. Do not include verse numbers or any conversational text.";
    
    // Call Gemini API
    $translatedText = callGeminiAPI($prompt, 'gemini-2.5-flash');
    
    echo json_encode(["success" => true, "text" => trim($translatedText)]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
