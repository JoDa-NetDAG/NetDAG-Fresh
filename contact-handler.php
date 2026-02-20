<?php
/**
 * NetDAG Contact Form Handler
 * Sends emails via Zoho SMTP
 * Repository: JoDa-NetDAG/NetDAG-Fresh
 */

// ==============================================
// CONFIGURATION - ADD YOUR ZOHO CREDENTIALS
// ==============================================

// Zoho SMTP Settings
define('SMTP_HOST', 'smtp.zoho.eu');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'info@netdag.com');
define('SMTP_PASSWORD', 'YOUR_ZOHO_PASSWORD_HERE'); // ⚠️ ADD YOUR PASSWORD
define('SMTP_FROM', 'info@netdag.com');
define('SMTP_FROM_NAME', 'NetDAG Contact Form');
define('SMTP_TO', 'info@netdag.com');

// Security
define('ALLOWED_ORIGIN', 'https://www.netdag.com');

// ==============================================
// CORS & SECURITY HEADERS
// ============================================== 

header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// ==============================================
// GET AND VALIDATE INPUT
// ==============================================

$input = json_decode(file_get_contents('php://input'), true);

$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$subject = trim($input['subject'] ?? '');
$message = trim($input['message'] ?? '');

$errors = [];

// Validate Name
if (empty($name)) {
    $errors[] = 'Name is required';
} elseif (strlen($name) < 2) {
    $errors[] = 'Name must be at least 2 characters';
} elseif (strlen($name) > 100) {
    $errors[] = 'Name is too long';
}

// Validate Email
if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email address';
}

// Validate Subject
if (empty($subject)) {
    $errors[] = 'Subject is required';
} elseif (strlen($subject) < 3) {
    $errors[] = 'Subject must be at least 3 characters';
} elseif (strlen($subject) > 200) {
    $errors[] = 'Subject is too long';
}

// Validate Message
if (empty($message)) {
    $errors[] = 'Message is required';
} elseif (strlen($message) < 10) {
    $errors[] = 'Message must be at least 10 characters';
} elseif (strlen($message) > 5000) {
    $errors[] = 'Message is too long';
}

// Check for spam patterns
$spam_keywords = ['viagra', 'cialis', 'casino', 'lottery', 'bitcoin wallet'];
$combined_text = strtolower($name . ' ' . $email . ' ' . $subject . ' ' . $message);
foreach ($spam_keywords as $keyword) {
    if (strpos($combined_text, $keyword) !== false) {
        $errors[] = 'Spam detected';
        break;
    }
}

// Return errors if validation failed
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => implode(', ', $errors)]);
    exit;
}

// ==============================================
// CHECK ZOHO PASSWORD CONFIGURED
// ============================================== 

if (SMTP_PASSWORD === 'YOUR_ZOHO_PASSWORD_HERE') {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Email system not configured. Please contact administrator.']);
    exit;
}

// ==============================================
// PREPARE EMAIL
// ==============================================

$to = SMTP_TO;
$email_subject = '[NetDAG Contact] ' . $subject;

// HTML Email Body
$email_body = "
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 5px 5px; }
        .field { margin-bottom: 20px; }
        .label { font-weight: bold; color: #667eea; margin-bottom: 5px; }
        .value { padding: 10px; background: #f5f5f5; border-left: 3px solid #667eea; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>📧 New Contact Form Submission</h2>
        </div>
        <div class='content'>
            <div class='field'>
                <div class='label'>Name:</div>
                <div class='value"> . htmlspecialchars($name) . "</div>
            </div>
            <div class='field'>
                <div class='label'>Email:</div>
                <div class='value"> . htmlspecialchars($email) . "</div>
            </div>
            <div class='field'>
                <div class='label'>Subject:</div>
                <div class='value"> . htmlspecialchars($subject) . "</div>
            </div>
            <div class='field'>
                <div class='label'>Message:</div>
                <div class='value"> . nl2br(htmlspecialchars($message)) . "</div>
            </div>
            <div class='footer'>
                <p>Sent from NetDAG Contact Form<br>
                " . date('Y-m-d H:i:s') . " UTC</p>
            </div>
        </div>
    </div>
</body>
</html>
";

// Plain text version
$email_body_plain = "New Contact Form Submission\n\n";
$email_body_plain .= "Name: $name\n";
$email_body_plain .= "Email: $email\n";
$email_body_plain .= "Subject: $subject\n\n";
$email_body_plain .= "Message:\n$message\n\n";
$email_body_plain .= "---\nSent from NetDAG Contact Form\n" . date('Y-m-d H:i:s') . " UTC";

// ==============================================
// SEND EMAIL VIA ZOHO SMTP
// ============================================== 

require_once 'PHPMailer/PHPMailer.php';
require_once 'PHPMailer/SMTP.php';
require_once 'PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

try {
    // SMTP Configuration
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USERNAME;
    $mail->Password = SMTP_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = SMTP_PORT;
    $mail->CharSet = 'UTF-8';

    // Sender & Recipient
    $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
    $mail->addAddress($to);
    $mail->addReplyTo($email, $name);

    // Content
    $mail->isHTML(true);
    $mail->Subject = $email_subject;
    $mail->Body = $email_body;
    $mail->AltBody = $email_body_plain;

    // Send
    $mail->send();

    // Success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for contacting us! We will respond shortly.'
    ]);

} catch (Exception $e) {
    // Log error (you can save to file for debugging)
    error_log('Contact Form Error: ' . $mail->ErrorInfo);

    // Error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to send message. Please try again later or email us directly at info@netdag.com'
    ]);
}
?>