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
    
    $text = isset($data['text']) ? $data['text'] : '';
    
    if (!$text) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Text is required"]);
        exit();
    }
    
    $prompt = "You are an expert Bible formatter. Below is a text from the New Testament.
Your task is to identify any direct quotes spoken by Jesus Christ or God the Father.
Wrap exactly the words they speak in `[red]` and `[/red]`.
DO NOT change any words, punctuation, or formatting other than adding the bracket tags around the spoken words.
If the text does not contain words spoken by Jesus or God, leave the text exactly as it is.

For example:
Input: \"Jesus answered, \\\"I am the way and the truth and the life.\\\"\"
Output: \"Jesus answered, \\\"[red]I am the way and the truth and the life.[/red]\\\"\"

Here is the text to process:
{$text}";
    
    // Call Gemini API
    $processedText = callGeminiAPI($prompt, 'gemini-2.5-flash');
    
    echo json_encode(["success" => true, "data" => trim($processedText)]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
