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
    
    $text = isset($data['text']) ? $data['text'] : '';
    if (!$text) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Text is required"]);
        exit();
    }
    
    $prayer = null;
    $apiKey = GEMINI_API_KEY;
    
    // 1. Generate Prayer
    try {
        $prompt = "Write a short, comforting personal prayer (2-3 sentences) for someone who is feeling/experiencing: \"{$text}\". Keep it compassionate, uplifting, and rooted in Christian faith. Do not use markdown, just text.";
        $prayer = callGeminiAPI($prompt, 'gemini-3.6-flash');
    } catch(Exception $e) {
        $prayer = "ERROR: " . $e->getMessage();
    }
    
    // 2. Keyword Match against Topics
    $words = preg_split('/\b\w+\b/u', strtolower($text), -1, PREG_SPLIT_NO_EMPTY);
    
    $stmt = $pdo->query("SELECT id, name, keywords FROM topics");
    $topics = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $matchedTopicIds = [];
    foreach ($topics as $topic) {
        $keywords = explode(',', $topic['keywords']);
        foreach ($keywords as $kw) {
            $kwt = trim(strtolower($kw));
            if (in_array($kwt, $words)) {
                $matchedTopicIds[] = $topic['id'];
                break;
            }
        }
    }
    
    if (count($matchedTopicIds) === 0) {
        // --- AI FALLBACK & HARVESTING ENGINE ---
        $prompt2 = "
The user is expressing the following feeling or situation: \"{$text}\"
Identify the core emotion or topic (e.g., \"Grief\", \"Anxiety\", \"Doubt\", \"Heartbreak\", \"Anger\").
Provide a list of 5-8 related keywords (lowercase).
Find exactly 3 comforting King James Version (KJV) Bible verses that address this feeling.
Return ONLY valid JSON matching this schema:
{
  \"topic_name\": \"string\",
  \"keywords\": [\"string\", \"string\"],
  \"verses\": [
    { \"book\": \"string\", \"chapter\": number, \"verse\": number }
  ]
}";
        
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={$apiKey}";
        $postData = [
            "contents" => [
                [
                    "parts" => [
                        ["text" => $prompt2]
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
        curl_close($ch);
        
        $result = json_decode($response, true);
        $rawText = isset($result['candidates'][0]['content']['parts'][0]['text']) ? $result['candidates'][0]['content']['parts'][0]['text'] : '{}';
        
        $aiData = json_decode($rawText, true);
        
        if ($aiData && isset($aiData['topic_name']) && isset($aiData['verses'])) {
            $topicName = $aiData['topic_name'];
            $newKeywords = implode(',', $aiData['keywords']);
            
            $pdo->beginTransaction();
            try {
                $insTopic = $pdo->prepare("INSERT INTO topics (name, keywords) VALUES (?, ?)");
                $insTopic->execute([$topicName, $newKeywords]);
                $newTopicId = $pdo->lastInsertId();
                
                foreach ($aiData['verses'] as $v) {
                    $book = $v['book'];
                    $chap = $v['chapter'];
                    $vnum = $v['verse'];
                    
                    $selVerse = $pdo->prepare("SELECT id FROM verses WHERE book_id = (SELECT id FROM books WHERE name = ? LIMIT 1) AND chapter = ? AND verse = ? LIMIT 1");
                    $selVerse->execute([$book, $chap, $vnum]);
                    $verseRow = $selVerse->fetch(PDO::FETCH_ASSOC);
                    
                    if ($verseRow) {
                        $insMap = $pdo->prepare("INSERT IGNORE INTO topic_verse_map (topic_id, verse_id) VALUES (?, ?)");
                        $insMap->execute([$newTopicId, $verseRow['id']]);
                    }
                }
                $pdo->commit();
                $matchedTopicIds = [$newTopicId];
            } catch(Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
        }
    }
    
    // Return verses for matched topics
    $verses = [];
    if (count($matchedTopicIds) > 0) {
        $inQuery = implode(',', array_fill(0, count($matchedTopicIds), '?'));
        
        $sql = "
          SELECT v.id, b.name as book_name, v.chapter, v.verse, v.text 
          FROM topic_verse_map tvm
          JOIN verses v ON tvm.verse_id = v.id
          JOIN books b ON v.book_id = b.id
          WHERE tvm.topic_id IN ($inQuery)
          ORDER BY RAND() LIMIT 5
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($matchedTopicIds);
        $verses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode(["success" => true, "prayer" => trim($prayer), "verses" => $verses]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
