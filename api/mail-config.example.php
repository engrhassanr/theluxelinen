<?php
/**
 * Copy to mail-config.php and fill in Hostinger mailbox credentials.
 * mail-config.php is gitignored — never commit real passwords / secrets.
 */
return [
    'to'         => 'info@theluxelinen.ie',
    'from'       => 'info@theluxelinen.ie',
    'from_name'  => 'The Luxe Linen Website',
    'smtp_host'  => 'smtp.hostinger.com',
    'smtp_port'  => 465,
    'smtp_enc'   => 'ssl', // ssl (465) or tls (587)
    'smtp_user'  => 'info@theluxelinen.ie',
    'smtp_pass'  => 'YOUR_MAILBOX_PASSWORD',
    'recaptcha_secret' => 'YOUR_RECAPTCHA_SECRET_KEY',
    'recaptcha_enabled' => true,
    'debug' => false,
];
