<?php
/**
 * NetDAG Contact Form Handler
 * Sends emails via Zoho Mail SMTP
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get form data
$firstName = trim($_POST['firstName'] ?? '');
$lastName = trim($_POST['lastName'] ?? '');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');

// Validation
if (empty($firstName) || empty($lastName) || empty($email) || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit;
}

// Zoho Mail SMTP Configuration
$smtpHost = 'smtp.zoho.eu';
$smtpPort = 465;
$smtpUsername = 'info@netdag.com';
$smtpPassword = '281969Mose*'; // ⚠️ REPLACE THIS

// Check if PHPMailer is available
if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
    require 'PHPMailer/src/Exception.php';
    require 'PHPMailer/src/PHPMailer.php';
    require 'PHPMailer/src/SMTP.php';
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    $mail = new PHPMailer(true);
    
    // SMTP Configuration
    $mail->isSMTP();
    $mail->Host = $smtpHost;
    $mail->SMTPAuth = true;
    $mail->Username = $smtpUsername;
    $mail->Password = $smtpPassword;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = $smtpPort;
    $mail->CharSet = 'UTF-8';
    
    // Email Configuration
    $mail->setFrom('info@netdag.com', 'NetDAG Contact Form');
    $mail->addAddress('info@netdag.com', 'NetDAG Team');
    $mail->addReplyTo($email, $firstName . ' ' . $lastName);
    
    // Content
    $mail->isHTML(true);
    $mail->Subject = 'New Contact Form Submission - NetDAG';
    
    $mail->Body = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6;'>
            <h2 style='color: #1e40af;'>New Contact Form Submission</h2>
            <p><strong>Name:</strong> {$firstName} {$lastName}</p>
            <p><strong>Email:</strong> <a href='mailto:{$email}'>{$email}</a></p>
            <hr>
            <p><strong>Message:</strong></p>
            <p style='background: #f3f4f6; padding: 15px; border-radius: 5px;'>{$message}</p>
        </body>
        </html>
    ";
    
    $mail->AltBody = "New Contact Form Submission\n\n"
                   . "Name: {$firstName} {$lastName}\n"
                   . "Email: {$email}\n\n"
                   . "Message:\n{$message}";
    
    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
    
} catch (Exception $e) {
    error_log("Contact form error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to send email. Please try again.']);
}
?>