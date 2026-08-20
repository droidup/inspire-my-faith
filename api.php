<?php
// Centralized API Router for Inspire My Faith (PHP Architecture)
// Bypasses Node.js completely.

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure db.php is required for $pdo
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$route = isset($_GET['route']) ? rtrim($_GET['route'], '/') : '';

// Parse JSON Body for POST/PUT
$body = [];
if ($method === 'POST' || $method === 'PUT') {
    $input = file_get_contents('php://input');
    if (!empty($input)) {
        $body = json_decode($input, true) ?: [];
    }
}

// ---------------------------------------------------------
// Helper function to extract path variables
// Usage: matchRoute('bible/verses/:bookId/:chapter', $route, $matches)
// ---------------------------------------------------------
function matchRoute($pattern, $actualRoute, &$params) {
    $patternRegex = preg_replace('/:([a-zA-Z0-9_]+)/', '(?P<$1>[a-zA-Z0-9_-]+)', $pattern);
    $patternRegex = '#^' . $patternRegex . '$#';
    
    if (preg_match($patternRegex, $actualRoute, $matches)) {
        $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
        return true;
    }
    return false;
}

$params = [];

try {
    // =========================================================
    // 1. CORE BIBLE ROUTES
    // =========================================================
    
    if ($method === 'GET' && $route === 'bible/books') {
        $stmt = $pdo->query("
            SELECT 
                b.*,
                COUNT(v.id) as total_verses,
                COUNT(vt.verse_id) as imf_verses
            FROM books b
            LEFT JOIN verses v ON b.id = v.book_id
            LEFT JOIN verse_translations vt ON v.id = vt.verse_id AND vt.version = 'IMF'
            GROUP BY b.id
            ORDER BY b.book_order ASC
        ");
        $books = $stmt->fetchAll();
        foreach ($books as &$book) {
            $book['completed'] = ($book['total_verses'] > 0 && $book['total_verses'] == $book['imf_verses']);
            // Type casting to match React expectations
            $book['total_verses'] = (int)$book['total_verses'];
            $book['imf_verses'] = (int)$book['imf_verses'];
        }
        echo json_encode(['success' => true, 'data' => $books]);
        exit();
    }
    
    if ($method === 'GET' && matchRoute('bible/books/:bookId/chapters', $route, $params)) {
        $stmt = $pdo->prepare("SELECT MAX(chapter) as chapterCount FROM verses WHERE book_id = ?");
        $stmt->execute([$params['bookId']]);
        $row = $stmt->fetch();
        echo json_encode(['success' => true, 'data' => (int)$row['chapterCount']]);
        exit();
    }

    if ($method === 'GET' && matchRoute('bible/verses/:bookId/:chapter', $route, $params)) {
        // We will implement this next
        echo json_encode(['success' => true, 'data' => []]);
        exit();
    }
    
    // =========================================================
    // 2. USER DATA ROUTES (PRAYERS, VERSES, ETC)
    // =========================================================
    
    // We will implement user routes next
    
    // =========================================================
    // FALLBACK 404
    // =========================================================
    http_response_code(404);
    echo json_encode(['error' => "API Route Not Found: $route"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Internal Server Error',
        'error' => $e->getMessage()
    ]);
}
?>
