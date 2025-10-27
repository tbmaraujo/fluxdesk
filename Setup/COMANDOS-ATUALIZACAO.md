# Comandos de Atualização — Fluxdesk

Guia rápido com comandos essenciais para atualizar e manter o projeto Fluxdesk.

---

## 📦 Atualizar Dependências

### Backend (PHP/Composer)
```bash
# Atualizar todas as dependências
composer update

# Atualizar dependências específicas
composer update laravel/framework

# Instalar dependências (production)
composer install --no-dev --optimize-autoloader
```

### Frontend (Node/pnpm)
```bash
# Atualizar todas as dependências
pnpm update

# Atualizar dependências específicas
pnpm update react react-dom

# Instalar dependências
pnpm install --frozen-lockfile
```

---

## 🗄️ Migrações e Banco de Dados

```bash
# Rodar novas migrações
php artisan migrate

# Rodar migrações (production - requer confirmação)
php artisan migrate --force

# Reverter última migração
php artisan migrate:rollback

# Reverter até batch específico
php artisan migrate:rollback --batch=3

# Ver status das migrações
php artisan migrate:status

# Recriar banco (CUIDADO: apaga tudo!)
php artisan migrate:fresh --seed
```

---

## 🧹 Limpar Cache

```bash
# Limpar todos os caches
php artisan optimize:clear

# Comandos individuais:
php artisan cache:clear          # Cache da aplicação
php artisan config:clear         # Cache de configuração
php artisan route:clear          # Cache de rotas
php artisan view:clear           # Cache de views
php artisan event:clear          # Cache de eventos
```

---

## ⚡ Otimizações (Production)

```bash
# Cachear configurações
php artisan config:cache

# Cachear rotas
php artisan route:cache

# Cachear views
php artisan view:cache

# Cachear eventos
php artisan event:cache

# Otimizar autoloader do Composer
composer dump-autoload --optimize
```

---

## 🎨 Frontend (Build)

```bash
# Desenvolvimento (com hot reload)
pnpm dev

# Build para produção
pnpm build

# Verificar erros de lint
pnpm lint

# Rodar testes
pnpm test
```

---

## 🔄 Filas e Workers

```bash
# Iniciar worker (desenvolvimento)
php artisan queue:work

# Worker com opções recomendadas (production)
php artisan queue:work --sleep=1 --max-time=3600 --max-jobs=1000

# Reiniciar todos os workers
php artisan queue:restart

# Ver jobs falhados
php artisan queue:failed

# Reprocessar job falhado
php artisan queue:retry {id}

# Reprocessar todos os jobs falhados
php artisan queue:retry all
```

---

## 🔍 Diagnóstico e Testes

```bash
# Rodar testes
php artisan test

# Rodar testes com coverage
php artisan test --coverage

# Ver rotas disponíveis
php artisan route:list

# Informações do ambiente
php artisan about

# Verificar requisitos do sistema
php artisan env
```

---

## 🚀 Deploy Completo (Produção)

Sequência recomendada para atualizar em produção:

```bash
# 1. Entrar em modo de manutenção
php artisan down

# 2. Atualizar código (git pull ou similar)
git pull origin main

# 3. Instalar dependências backend
composer install --no-dev --optimize-autoloader

# 4. Instalar dependências frontend
pnpm install --frozen-lockfile

# 5. Build do frontend
pnpm build

# 6. Rodar migrações
php artisan migrate --force

# 7. Limpar e cachear
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 8. Reiniciar workers
php artisan queue:restart

# 9. Sair do modo de manutenção
php artisan up
```

---

## 🔧 Permissões (se necessário)

```bash
# Ajustar permissões de storage e cache
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

---

## 📊 Logs e Monitoramento

```bash
# Ver logs em tempo real
tail -f storage/logs/laravel.log

# Ver últimas 100 linhas
tail -n 100 storage/logs/laravel.log

# Limpar logs antigos (cuidado!)
echo "" > storage/logs/laravel.log
```

---

## 💡 Dicas Importantes

1. **Sempre fazer backup** do banco antes de migrações em produção
2. **Testar em ambiente de staging** antes de aplicar em produção
3. **Usar `--force`** em migrações de produção (Laravel requer confirmação)
4. **Reiniciar workers** após deploy para carregar novo código
5. **Verificar logs** após deploy para detectar erros
6. **Limpar cache** antes de cachear novamente em produção

---

## 🆘 Troubleshooting

### "Class not found" após atualização
```bash
composer dump-autoload
php artisan optimize:clear
```

### Workers não processam jobs atualizados
```bash
php artisan queue:restart
```

### Erro de permissões
```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### Frontend não reflete mudanças
```bash
pnpm build
php artisan view:clear
```

---

**Documentação completa:**
- [Laravel Deployment](https://laravel.com/docs/11.x/deployment)
- [Laravel Queues](https://laravel.com/docs/11.x/queues)
- [Vite Asset Building](https://laravel.com/docs/11.x/vite)

