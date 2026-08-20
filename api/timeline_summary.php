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
    
    $events = isset($data['events']) ? $data['events'] : [];
    if (empty($events)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Events are required"]);
        exit();
    }
    
    $eventsTextArray = [];
    foreach ($events as $e) {
        $date = isset($e['timestamp']) ? date('n/j/Y', $e['timestamp'] / 1000) : '';
        $type = isset($e['type']) ? $e['type'] : '';
        $title = isset($e['title']) ? $e['title'] : '';
        $desc = isset($e['description']) ? $e['description'] : '';
        $eventsTextArray[] = "Date: $date\nType: $type\nTitle: $title\nDescription: $desc";
    }
    $eventsText = implode("\n\n", $eventsTextArray);
    
    $prompt = "You are a compassionate, encouraging Christian AI pastor writing a short pastoral summary (about 2-3 paragraphs) to a user based on their recent timeline of spiritual activity.
      
Here is their activity log:
{$eventsText}

Write a gentle, encouraging letter to them. Address them as \"Dear Friend,\" and ALWAYS sign off at the very end with \"Your AI Pastor\". Do not sign off as \"Your Pastor\" or anything else. It must be clear that you are an AI.
Analyze their spiritual journey based on these activities (prayers, notes, saved verses). Acknowledge their focuses, notice any growth or patterns in faith, and offer biblical comfort.
Do NOT use heavy markdown formatting. You may use **bold** or *italics* sparingly, but do not use large headers or lists. Write it as a heartfelt letter.";
    
    $processedText = callGeminiAPI($prompt, 'gemini-3.6-flash');
    
    echo json_encode(["success" => true, "data" => trim($processedText)]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
