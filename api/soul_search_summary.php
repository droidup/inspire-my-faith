<?php
require_once 'cors.php';
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $history = isset($data['history']) ? $data['history'] : [];
    if (empty($history)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "History is required"]);
        exit();
    }
    
    $historyTextArray = [];
    foreach ($history as $h) {
        $role = $h['role'];
        $text = $h['text'];
        $historyTextArray[] = "$role: $text";
    }
    $historyText = implode("\n", $historyTextArray);
    
    $prompt = "You are a Christian AI summarizing a recent conversation/search session the user had. 
Write a very brief, comforting summary (1-2 sentences) of what they were searching for and the scriptural guidance provided.

Conversation history:
{$historyText}";

    $processedText = callGeminiAPI($prompt, 'gemini-1.5-flash');
    
    echo json_encode(["success" => true, "data" => trim($processedText)]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
