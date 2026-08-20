<?php
$data = json_encode([
    "userId" => "test_user",
    "sectionType" => "timeline",
    "oldName" => "Faith Timeline",
    "newName" => "Faith Timeline 2"
]);
$ch = curl_init('http://localhost:8000/api/rename_collection.php');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($data)
]);
$result = curl_exec($ch);
echo "Response: " . $result;
?>
