<?php
require_once 'cors.php';
require_once '../db.php';

// Helper function to get current season based on date
function getCurrentSeason($month, $day) {
    if ($month == 12 || $month == 1 || $month == 2) return 'winter';
    if ($month >= 3 && $month <= 5) {
        if ($month == 4 || ($month == 3 && $day > 15)) return 'easter'; // Rough approximation
        return 'spring';
    }
    if ($month >= 6 && $month <= 8) return 'summer';
    if ($month >= 9 && $month <= 11) {
        if ($month == 11 && $day > 20) return 'thanksgiving';
        return 'fall';
    }
    return 'general';
}

try {
    $month = (int)date('n');
    $day = (int)date('j');
    $dayOfYear = (int)date('z') + 1; // 1-365
    $season = getCurrentSeason($month, $day);

    // Try fetching for current season
    $stmt = $pdo->prepare("SELECT * FROM daily_inspiration WHERE season_tag = ?");
    $stmt->execute([$season]);
    $verses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fallback to general if no season verses
    if (count($verses) === 0 && $season !== 'general') {
        $stmt = $pdo->prepare("SELECT * FROM daily_inspiration WHERE season_tag = 'general'");
        $stmt->execute();
        $verses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Ultimate fallback if nothing matches
    if (count($verses) === 0) {
        $stmt = $pdo->prepare("SELECT * FROM daily_inspiration");
        $stmt->execute();
        $verses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    if (count($verses) === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "No verses found"]);
        exit();
    }

    // Deterministic random selection for the day
    $index = $dayOfYear % count($verses);
    $verse = $verses[$index];
    
    // Add text field alias to match frontend expectations
    $verse['text'] = $verse['verse_text'];
    
    echo json_encode(["success" => true, "data" => $verse]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
