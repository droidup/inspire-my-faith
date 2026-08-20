<?php
// Secure configuration file for API Keys and Secrets
// DO NOT commit this file to public repositories if it contains sensitive keys!

define('GEMINI_API_KEY', 'YOUR_GEMINI_API_KEY_HERE');

// Helper function to call the Gemini REST API
function callGeminiAPI($prompt, $model = 'gemini-3.6-flash') {
    $apiKey = GEMINI_API_KEY;
    if ($apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Exception("Gemini API Key is not configured in config.php");
    }

    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
    
    $data = [
        "contents" => [
            [
                "parts" => [
                    ["text" => $prompt]
                ]
            ]
        ]
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        throw new Exception("cURL Error: " . curl_error($ch));
    }
    
    curl_close($ch);
    
    if ($httpCode >= 400) {
        throw new Exception("Gemini API Error (HTTP $httpCode): " . $response);
    }
    
    $result = json_decode($response, true);
    
    if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
        return $result['candidates'][0]['content']['parts'][0]['text'];
    }
    
    throw new Exception("Unexpected Gemini API response format: " . $response);
}
?>
