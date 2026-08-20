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
    
    $verses = isset($data['verses']) ? $data['verses'] : [];
    $version = isset($data['version']) ? $data['version'] : '';
    
    if (empty($verses) || !$version) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing verses or version"]);
        exit();
    }
    
    if ($version === 'KJV') {
        echo json_encode(["success" => true, "data" => $verses]);
        exit();
    }
    
    $verseIds = [];
    foreach ($verses as $v) {
        $verseIds[] = $v['id'];
    }
    
    // Check DB for existing
    $inQuery = implode(',', array_fill(0, count($verseIds), '?'));
    $sql = "SELECT verse_id, text FROM verse_translations WHERE version = ? AND verse_id IN ($inQuery)";
    $stmt = $pdo->prepare($sql);
    
    $params = [$version];
    foreach ($verseIds as $vid) {
        $params[] = $vid;
    }
    
    $stmt->execute($params);
    $existingRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $existingMap = [];
    foreach ($existingRows as $row) {
        $existingMap[$row['verse_id']] = $row['text'];
    }
    
    // Identify missing
    $missingVerses = [];
    foreach ($verses as $v) {
        if (!isset($existingMap[$v['id']])) {
            $missingVerses[] = $v;
        }
    }
    
    if (count($missingVerses) > 0) {
        if ($version === 'WEB' || $version === 'BBE') {
            foreach ($missingVerses as $mv) {
                $bookName = urlencode($mv['book_name']);
                $url = "https://bible-api.com/{$bookName}%20{$mv['chapter']}:{$mv['verse']}?translation=" . strtolower($version);
                $res = @file_get_contents($url);
                if ($res) {
                    $resData = json_decode($res, true);
                    if (isset($resData['text'])) {
                        $text = trim($resData['text']);
                        $existingMap[$mv['id']] = $text;
                        
                        $insStmt = $pdo->prepare("INSERT IGNORE INTO verse_translations (verse_id, version, text) VALUES (?, ?, ?)");
                        $insStmt->execute([$mv['id'], $version, $text]);
                    }
                }
            }
        } else {
            // Gemini (BSB, IMF, etc)
            $apiKey = GEMINI_API_KEY;
            
            $prompt = "";
            if ($version === 'IMF') {
                // Fetch BSB for reference
                $bsbIds = [];
                foreach ($missingVerses as $mv) {
                    $bsbIds[] = $mv['id'];
                }
                $bsbIn = implode(',', array_fill(0, count($bsbIds), '?'));
                $bsbSql = "SELECT verse_id, text FROM verse_translations WHERE version = 'BSB' AND verse_id IN ($bsbIn)";
                $bsbStmt = $pdo->prepare($bsbSql);
                $bsbParams = $bsbIds;
                $bsbStmt->execute($bsbParams);
                $bsbRows = $bsbStmt->fetchAll(PDO::FETCH_ASSOC);
                $bsbMap = [];
                foreach ($bsbRows as $r) {
                    $bsbMap[$r['verse_id']] = $r['text'];
                }
                
                // Fetch chapter summary
                $bookId = $missingVerses[0]['book_id'];
                $chapter = $missingVerses[0]['chapter'];
                $sumStmt = $pdo->prepare("SELECT summary FROM chapter_summaries WHERE book_id = ? AND chapter = ?");
                $sumStmt->execute([$bookId, $chapter]);
                $sumRow = $sumStmt->fetch(PDO::FETCH_ASSOC);
                $summary = $sumRow ? $sumRow['summary'] : 'No summary available.';
                
                $verseLines = [];
                foreach ($missingVerses as $mv) {
                    $bsbText = isset($bsbMap[$mv['id']]) ? $bsbMap[$mv['id']] : $mv['text'];
                    $verseLines[] = "{$mv['book_name']} {$mv['chapter']}:{$mv['verse']} ({$bsbText})";
                }
                $verseList = implode("\n", $verseLines);
                
                $prompt = "You are translating Bible verses into a modern, novel-like narrative style, as part of the 'Inspire My Faith' (IMF) version. Make it engaging, relatable, and use United States English.
Here is the chapter summary to guide the context:
{$summary}

Translate the following Berean Standard Bible (BSB) verses:
{$verseList}

Return ONLY a JSON array of strings containing just the verse text, in the exact same order. Do not include markdown blocks.";

            } else {
                $verseLines = [];
                foreach ($missingVerses as $mv) {
                    $verseLines[] = "{$mv['book_name']} {$mv['chapter']}:{$mv['verse']}";
                }
                $verseList = implode("\n", $verseLines);
                
                $prompt = "Provide the exact text for the following Bible verses in the {$version} translation.
Verses:
{$verseList}

Return ONLY a JSON array of strings containing just the verse text, in the exact same order. Do not include markdown blocks.";
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
            curl_close($ch);
            
            $result = json_decode($response, true);
            $rawText = isset($result['candidates'][0]['content']['parts'][0]['text']) ? $result['candidates'][0]['content']['parts'][0]['text'] : '[]';
            
            $translatedTexts = json_decode($rawText, true);
            
            if (is_array($translatedTexts) && count($translatedTexts) === count($missingVerses)) {
                $pdo->beginTransaction();
                $insStmt = $pdo->prepare("INSERT IGNORE INTO verse_translations (verse_id, version, text) VALUES (?, ?, ?)");
                
                foreach ($missingVerses as $index => $mv) {
                    $tText = $translatedTexts[$index];
                    $existingMap[$mv['id']] = $tText;
                    $insStmt->execute([$mv['id'], $version, $tText]);
                }
                $pdo->commit();
            }
        }
    }
    
    // Stitch it all together
    foreach ($verses as &$v) {
        if (isset($existingMap[$v['id']])) {
            $v['text'] = $existingMap[$v['id']];
        }
    }
    
    echo json_encode(["success" => true, "data" => $verses]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
