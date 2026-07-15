<?php
/**
 * Minimal SMTP client for Hostinger (tries SSL 465, then TLS 587).
 */
function smtp_send(array $cfg, string $to, string $subject, string $body, string $replyTo = '', string $replyName = ''): array
{
    $attempts = [
        [
            'host' => $cfg['smtp_host'],
            'port' => (int) ($cfg['smtp_port'] ?? 465),
            'enc'  => strtolower((string) ($cfg['smtp_enc'] ?? 'ssl')),
        ],
        // Hostinger fallback
        [
            'host' => $cfg['smtp_host'],
            'port' => 587,
            'enc'  => 'tls',
        ],
    ];

    // Deduplicate if primary already 587/tls
    $seen = [];
    $unique = [];
    foreach ($attempts as $a) {
        $key = $a['enc'] . ':' . $a['port'];
        if (isset($seen[$key])) continue;
        $seen[$key] = true;
        $unique[] = $a;
    }

    $errors = [];
    foreach ($unique as $attempt) {
        $result = smtp_send_once($cfg, $attempt, $to, $subject, $body, $replyTo, $replyName);
        if (!empty($result['ok'])) {
            return $result;
        }
        $errors[] = $attempt['enc'] . ':' . $attempt['port'] . ' → ' . ($result['error'] ?? 'failed');
    }

    return ['ok' => false, 'error' => implode(' | ', $errors)];
}

function smtp_send_once(array $cfg, array $attempt, string $to, string $subject, string $body, string $replyTo, string $replyName): array
{
    $host = $attempt['host'];
    $port = (int) $attempt['port'];
    $enc  = $attempt['enc'];
    $user = $cfg['smtp_user'];
    $pass = $cfg['smtp_pass'];
    $from = $cfg['from'];
    $fromName = $cfg['from_name'] ?? 'Website';

    $remote = ($enc === 'ssl' ? 'ssl://' : '') . $host . ':' . $port;
    $context = stream_context_create([
        'ssl' => [
            'verify_peer'       => true,
            'verify_peer_name'  => true,
            'allow_self_signed' => false,
            'crypto_method'     => STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT,
        ],
    ]);

    $errno = 0;
    $errstr = '';
    $fp = @stream_socket_client($remote, $errno, $errstr, 25, STREAM_CLIENT_CONNECT, $context);
    if (!$fp) {
        // Retry once without strict verify (some shared hosts need this)
        $context = stream_context_create([
            'ssl' => [
                'verify_peer'      => false,
                'verify_peer_name' => false,
            ],
        ]);
        $fp = @stream_socket_client($remote, $errno, $errstr, 25, STREAM_CLIENT_CONNECT, $context);
    }
    if (!$fp) {
        return ['ok' => false, 'error' => "SMTP connect failed ($errstr)"];
    }
    stream_set_timeout($fp, 25);

    $read = function () use ($fp) {
        $data = '';
        while ($line = fgets($fp, 515)) {
            $data .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $data;
    };
    $write = function (string $cmd) use ($fp) {
        fwrite($fp, $cmd . "\r\n");
    };
    $expect = function (string $prefix, string $label) use ($read) {
        $resp = $read();
        if (strpos($resp, $prefix) !== 0) {
            throw new RuntimeException(trim("$label: $resp"));
        }
        return $resp;
    };

    try {
        $expect('220', 'Greeting');
        $write('EHLO theluxelinen.ie');
        $expect('250', 'EHLO');

        if ($enc === 'tls') {
            $write('STARTTLS');
            $expect('220', 'STARTTLS');
            $cryptoOk = @stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT);
            if (!$cryptoOk) {
                $cryptoOk = @stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            }
            if (!$cryptoOk) {
                throw new RuntimeException('TLS negotiate failed');
            }
            $write('EHLO theluxelinen.ie');
            $expect('250', 'EHLO after TLS');
        }

        $write('AUTH LOGIN');
        $expect('334', 'AUTH');
        $write(base64_encode($user));
        $expect('334', 'AUTH user');
        $write(base64_encode($pass));
        $expect('235', 'AUTH pass');

        $write('MAIL FROM:<' . $from . '>');
        $expect('250', 'MAIL FROM');
        $write('RCPT TO:<' . $to . '>');
        $expect('250', 'RCPT TO');
        $write('DATA');
        $expect('354', 'DATA');

        $headers = [];
        $headers[] = 'Date: ' . date('r');
        $headers[] = 'From: ' . encode_address($fromName, $from);
        $headers[] = 'To: ' . $to;
        $headers[] = 'Subject: ' . encode_header($subject);
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        $headers[] = 'Content-Transfer-Encoding: 8bit';
        if ($replyTo !== '') {
            $headers[] = 'Reply-To: ' . encode_address($replyName !== '' ? $replyName : $replyTo, $replyTo);
        }
        $headers[] = 'X-Mailer: TheLuxeLinen/1.0';

        $dotBody = preg_replace('/^\./m', '..', str_replace(["\r\n", "\r"], "\n", $body));
        $dotBody = str_replace("\n", "\r\n", $dotBody);

        $write(implode("\r\n", $headers) . "\r\n\r\n" . $dotBody . "\r\n.");
        $expect('250', 'DATA body');
        $write('QUIT');
        fclose($fp);
        return ['ok' => true];
    } catch (Throwable $e) {
        fclose($fp);
        return ['ok' => false, 'error' => $e->getMessage()];
    }
}

function encode_header(string $text): string
{
    if (preg_match('/[^\x20-\x7E]/', $text)) {
        return '=?UTF-8?B?' . base64_encode($text) . '?=';
    }
    return $text;
}

function encode_address(string $name, string $email): string
{
    $safeName = trim(str_replace(["\r", "\n"], '', $name));
    if ($safeName === '') {
        return $email;
    }
    return encode_header($safeName) . ' <' . $email . '>';
}
