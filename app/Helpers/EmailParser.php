<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;

class EmailParser
{
    /**
     * Parsear conteúdo de e-mail (MIME).
     *
     * @param string $rawEmail
     * @return array
     */
    public static function parse(string $rawEmail): array
    {
        // Se o conteúdo é JSON (fallback), parsear como JSON
        if (self::isJson($rawEmail)) {
            return self::parseJsonEmail($rawEmail);
        }

        // Parsear e-mail MIME completo
        return self::parseMimeEmail($rawEmail);
    }

    /**
     * Verificar se o conteúdo é JSON.
     *
     * @param string $content
     * @return bool
     */
    private static function isJson(string $content): bool
    {
        json_decode($content);
        return json_last_error() === JSON_ERROR_NONE;
    }

    /**
     * Parsear e-mail em formato JSON (fallback).
     *
     * @param string $jsonEmail
     * @return array
     */
    private static function parseJsonEmail(string $jsonEmail): array
    {
        $data = json_decode($jsonEmail, true);

        return [
            'from' => $data['from'] ?? '',
            'from_name' => null,
            'to' => $data['to'] ?? [],
            'subject' => $data['subject'] ?? '',
            'body_text' => $data['subject'] ?? 'Conteúdo não disponível',
            'body_html' => null,
            'attachments' => [],
            'date' => $data['date'] ?? now()->toDateTimeString(),
        ];
    }

    /**
     * Parsear e-mail MIME completo.
     *
     * @param string $rawEmail
     * @return array
     */
    private static function parseMimeEmail(string $rawEmail): array
    {
        try {
            // Dividir headers e body
            $parts = preg_split('/\r?\n\r?\n/', $rawEmail, 2);
            $headers = $parts[0] ?? '';
            $body = $parts[1] ?? '';

            // Parsear headers
            $parsedHeaders = self::parseHeaders($headers);

            // Extrair informações do From
            $from = $parsedHeaders['from'] ?? '';
            $fromName = self::extractName($from);
            $fromEmail = self::extractEmail($from);

            // Extrair corpo do e-mail
            $contentType = $parsedHeaders['content-type'] ?? '';
            $bodyParts = self::parseBody($body, $contentType);

            return [
                'from' => $fromEmail,
                'from_name' => $fromName,
                'to' => self::parseEmailList($parsedHeaders['to'] ?? ''),
                'cc' => self::parseEmailList($parsedHeaders['cc'] ?? ''),
                'subject' => self::decodeHeader($parsedHeaders['subject'] ?? ''),
                'date' => $parsedHeaders['date'] ?? now()->toDateTimeString(),
                'message_id' => $parsedHeaders['message-id'] ?? '',
                'body_text' => $bodyParts['text'] ?? null,
                'body_html' => $bodyParts['html'] ?? null,
                'attachments' => $bodyParts['attachments'] ?? [],
            ];
        } catch (\Exception $e) {
            Log::error('Erro ao parsear e-mail MIME', [
                'error' => $e->getMessage(),
            ]);

            // Fallback: retornar conteúdo bruto como texto
            return [
                'from' => '',
                'from_name' => null,
                'to' => [],
                'subject' => 'Erro ao processar e-mail',
                'body_text' => $rawEmail,
                'body_html' => null,
                'attachments' => [],
                'date' => now()->toDateTimeString(),
            ];
        }
    }

    /**
     * Parsear headers do e-mail.
     *
     * @param string $headers
     * @return array
     */
    private static function parseHeaders(string $headers): array
    {
        $parsed = [];
        $lines = explode("\n", $headers);
        $currentHeader = null;

        foreach ($lines as $line) {
            $line = trim($line);

            // Linha continuação de header anterior
            if ($currentHeader && (str_starts_with($line, ' ') || str_starts_with($line, "\t"))) {
                $parsed[$currentHeader] .= ' ' . trim($line);
            }
            // Nova header
            elseif (str_contains($line, ':')) {
                [$key, $value] = explode(':', $line, 2);
                $currentHeader = strtolower(trim($key));
                $parsed[$currentHeader] = trim($value);
            }
        }

        return $parsed;
    }

    /**
     * Parsear corpo do e-mail (multipart ou simples).
     *
     * @param string $body
     * @param string $contentType
     * @return array
     */
    private static function parseBody(string $body, string $contentType): array
    {
        $result = [
            'text' => null,
            'html' => null,
            'attachments' => [],
        ];

        // Verificar se é multipart
        if (preg_match('/boundary="?([^";,\s]+)"?/', $contentType, $matches)) {
            $boundary = $matches[1];
            return self::parseMultipart($body, $boundary);
        }

        // E-mail simples (texto ou HTML)
        if (str_contains(strtolower($contentType), 'text/html')) {
            $result['html'] = self::decodeBody($body, $contentType);
        } else {
            $result['text'] = self::decodeBody($body, $contentType);
        }

        return $result;
    }

    /**
     * Parsear e-mail multipart (múltiplas partes).
     *
     * @param string $body
     * @param string $boundary
     * @return array
     */
    private static function parseMultipart(string $body, string $boundary): array
    {
        $result = [
            'text' => null,
            'html' => null,
            'attachments' => [],
        ];

        // Dividir por boundary
        $parts = explode('--' . $boundary, $body);

        foreach ($parts as $part) {
            $part = trim($part);
            if (empty($part) || $part === '--') {
                continue;
            }

            // Dividir headers e conteúdo da parte
            $partSections = preg_split('/\r?\n\r?\n/', $part, 2);
            if (count($partSections) < 2) {
                continue;
            }

            $partHeaders = self::parseHeaders($partSections[0]);
            $partBody = $partSections[1];

            $contentType = $partHeaders['content-type'] ?? '';
            $contentDisposition = $partHeaders['content-disposition'] ?? '';

            // É anexo?
            if (str_contains(strtolower($contentDisposition), 'attachment') ||
                str_contains(strtolower($contentDisposition), 'inline')) {
                $attachment = self::parseAttachment($partHeaders, $partBody);
                if ($attachment) {
                    $result['attachments'][] = $attachment;
                }
            }
            // É corpo HTML?
            elseif (str_contains(strtolower($contentType), 'text/html')) {
                $result['html'] = self::decodeBody($partBody, $contentType);
            }
            // É corpo texto?
            elseif (str_contains(strtolower($contentType), 'text/plain')) {
                $result['text'] = self::decodeBody($partBody, $contentType);
            }
            // É multipart aninhado?
            elseif (str_contains(strtolower($contentType), 'multipart')) {
                if (preg_match('/boundary="?([^";,\s]+)"?/', $contentType, $nestedMatches)) {
                    $nestedResult = self::parseMultipart($partBody, $nestedMatches[1]);
                    $result['text'] = $result['text'] ?? $nestedResult['text'];
                    $result['html'] = $result['html'] ?? $nestedResult['html'];
                    $result['attachments'] = array_merge($result['attachments'], $nestedResult['attachments']);
                }
            }
        }

        return $result;
    }

    /**
     * Parsear anexo.
     *
     * @param array $headers
     * @param string $body
     * @return array|null
     */
    private static function parseAttachment(array $headers, string $body): ?array
    {
        $contentType = $headers['content-type'] ?? 'application/octet-stream';
        $contentDisposition = $headers['content-disposition'] ?? '';
        $contentTransferEncoding = $headers['content-transfer-encoding'] ?? '';

        // Extrair nome do arquivo
        $filename = 'attachment-' . uniqid();
        if (preg_match('/filename\*?="?([^";,\s]+)"?/', $contentDisposition, $matches)) {
            $filename = $matches[1];
        } elseif (preg_match('/name\*?="?([^";,\s]+)"?/', $contentType, $matches)) {
            $filename = $matches[1];
        }

        // Decodificar conteúdo
        $content = $body;
        if (strtolower($contentTransferEncoding) === 'base64') {
            $content = base64_decode(trim($body));
        } elseif (strtolower($contentTransferEncoding) === 'quoted-printable') {
            $content = quoted_printable_decode($body);
        }

        // Extrair mime type
        $mimeType = explode(';', $contentType)[0];

        return [
            'filename' => self::decodeHeader($filename),
            'mime_type' => trim($mimeType),
            'content' => base64_encode($content), // Retornar como base64
            'size' => strlen($content),
        ];
    }

    /**
     * Decodificar corpo do e-mail.
     *
     * @param string $body
     * @param string $contentType
     * @return string
     */
    private static function decodeBody(string $body, string $contentType): string
    {
        // Verificar encoding
        if (str_contains(strtolower($contentType), 'base64')) {
            return base64_decode(trim($body));
        }

        if (str_contains(strtolower($contentType), 'quoted-printable')) {
            return quoted_printable_decode($body);
        }

        return $body;
    }

    /**
     * Decodificar header codificado (RFC 2047).
     *
     * @param string $header
     * @return string
     */
    private static function decodeHeader(string $header): string
    {
        return mb_decode_mimeheader($header);
    }

    /**
     * Extrair nome do campo From/To.
     *
     * @param string $field
     * @return string|null
     */
    private static function extractName(string $field): ?string
    {
        if (preg_match('/"?([^"<]+)"?\s*</', $field, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    /**
     * Extrair e-mail do campo From/To.
     *
     * @param string $field
     * @return string
     */
    private static function extractEmail(string $field): string
    {
        if (preg_match('/<([^>]+)>/', $field, $matches)) {
            return trim($matches[1]);
        }

        return trim($field);
    }

    /**
     * Parsear lista de e-mails (To, Cc, Bcc).
     *
     * @param string $field
     * @return array
     */
    private static function parseEmailList(string $field): array
    {
        if (empty($field)) {
            return [];
        }

        $emails = explode(',', $field);
        return array_map(fn($email) => self::extractEmail($email), $emails);
    }
}
