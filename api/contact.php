<?php
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$configPath = __DIR__ . '/mail-config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Mail is not configured on the server (missing mail-config.php).']);
    exit;
}

$cfg = require $configPath;
require __DIR__ . '/smtp.php';

// Parse JSON or form-urlencoded
$raw = file_get_contents('php://input');
$data = [];
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== false) {
    $data = json_decode($raw, true) ?: [];
} else {
    $data = $_POST;
    // Also accept raw form body if needed
    if (!$data && $raw) {
        parse_str($raw, $data);
    }
}

// Honeypot — bots fill this (renamed so browsers don't autofill)
if (!empty($data['fax_number']) || !empty($data['website'])) {
    echo json_encode(['ok' => true, 'message' => 'Thanks.']);
    exit;
}

function str_len($s) {
    return function_exists('mb_strlen') ? mb_strlen($s) : strlen($s);
}
function str_cut($s, $n) {
    return function_exists('mb_substr') ? mb_substr($s, 0, $n) : substr($s, 0, $n);
}

function verify_recaptcha(array $cfg, string $token, string $ip): bool
{
    $secret = trim((string) ($cfg['recaptcha_secret'] ?? ''));
    if ($secret === '' || $token === '') {
        return false;
    }

    $payload = http_build_query([
        'secret'   => $secret,
        'response' => $token,
        'remoteip' => $ip,
    ]);

    $context = stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $payload,
            'timeout' => 10,
        ],
    ]);

    $raw = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $context);
    if ($raw === false) {
        return false;
    }
    $json = json_decode($raw, true);
    return !empty($json['success']);
}

$type = trim((string) ($data['type'] ?? 'enquiry'));
$name = trim((string) ($data['name'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$phone = trim((string) ($data['phone'] ?? ''));
$message = trim((string) ($data['message'] ?? ''));
$captcha = trim((string) ($data['g-recaptcha-response'] ?? $data['recaptcha'] ?? ''));
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$debug = !empty($cfg['debug']);

// TEMP: reCAPTCHA disabled for testing — re-enable before going live
$recaptchaEnabled = !empty($cfg['recaptcha_enabled']);
if ($recaptchaEnabled && $type !== 'newsletter' && !verify_recaptcha($cfg, $captcha, $ip)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Please complete the reCAPTCHA check.']);
    exit;
}

if ($type === 'newsletter') {
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'Please enter a valid email address.']);
        exit;
    }
    $subject = 'Wholesale list signup — The Luxe Linen';
    $body = "New wholesale list signup\n\n"
        . "Email: {$email}\n"
        . "Submitted: " . date('Y-m-d H:i:s T') . "\n"
        . "IP: " . ($ip !== '' ? $ip : 'unknown') . "\n";
    $result = smtp_send($cfg, $cfg['to'], $subject, $body, $email);
    if (!$result['ok']) {
        error_log('Luxe Linen mail error: ' . ($result['error'] ?? 'unknown'));
        http_response_code(502);
        $err = 'Could not send right now. Please try again.';
        if ($debug) {
            $err .= ' [' . ($result['error'] ?? 'unknown') . ']';
        }
        echo json_encode(['ok' => false, 'error' => $err]);
        exit;
    }
    echo json_encode(['ok' => true, 'message' => 'Thanks — you\'re on the list.']);
    exit;
}

// Wholesale enquiry / quote
if ($name === '' || str_len($name) < 2) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Please enter your name.']);
    exit;
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Please enter a valid email address.']);
    exit;
}
if ($message === '' || str_len($message) < 5) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Please enter a short message.']);
    exit;
}

$name = str_cut($name, 120);
$phone = str_cut($phone, 40);
$message = str_cut($message, 4000);

$subject = 'Quote request — The Luxe Linen';

$body = "New quote / wholesale enquiry\n"
    . str_repeat('-', 40) . "\n"
    . "Name:     {$name}\n"
    . "Email:    {$email}\n"
    . "Phone:    " . ($phone !== '' ? $phone : '—') . "\n"
    . str_repeat('-', 40) . "\n"
    . "Message:\n{$message}\n"
    . str_repeat('-', 40) . "\n"
    . "Submitted: " . date('Y-m-d H:i:s T') . "\n"
    . "IP: " . ($ip !== '' ? $ip : 'unknown') . "\n";

$result = smtp_send($cfg, $cfg['to'], $subject, $body, $email, $name);

if (!$result['ok']) {
    error_log('Luxe Linen mail error: ' . ($result['error'] ?? 'unknown'));
    http_response_code(502);
    $err = 'Could not send right now. Please email info@theluxelinen.ie directly.';
    if ($debug) {
        $err .= ' [' . ($result['error'] ?? 'unknown') . ']';
    }
    echo json_encode(['ok' => false, 'error' => $err]);
    exit;
}

echo json_encode(['ok' => true, 'message' => 'Thanks — we\'ll reply within 1 business day.']);
