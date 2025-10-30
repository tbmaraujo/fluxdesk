-- Script para verificar estrutura da tabela replies
-- Execute este script ANTES e DEPOIS de rodar as migrations

\echo '=========================================='
\echo 'Estrutura da tabela replies'
\echo '=========================================='
\echo ''

-- Mostrar estrutura completa da tabela
\d replies

\echo ''
\echo '=========================================='
\echo 'Colunas da tabela replies'
\echo '=========================================='
\echo ''

-- Listar todas as colunas com tipos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'replies'
ORDER BY ordinal_position;

\echo ''
\echo '=========================================='
\echo 'Contagem de registros'
\echo '=========================================='
\echo ''

-- Contar registros existentes
SELECT COUNT(*) as total_replies FROM replies;

\echo ''
\echo '=========================================='
\echo 'Últimas 5 respostas'
\echo '=========================================='
\echo ''

-- Mostrar últimas 5 respostas
SELECT 
    id,
    ticket_id,
    user_id,
    CASE 
        WHEN LENGTH(content) > 50 THEN LEFT(content, 50) || '...'
        ELSE content 
    END as content_preview,
    created_at
FROM replies
ORDER BY created_at DESC
LIMIT 5;

