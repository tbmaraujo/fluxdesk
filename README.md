# 🎫 Sincro8 Tickets

Sistema de Gerenciamento de Chamados desenvolvido para substituir o TI FLUX, oferecendo uma experiência moderna e eficiente no controle de tickets de suporte técnico.

<p align="center">
<img src="https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 11">
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18">
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/Inertia.js-1.0-9553E9?style=for-the-badge&logo=inertia&logoColor=white" alt="Inertia.js">
<img src="https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
<img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</p>

---

## 📋 Sobre o Projeto

O **Sincro8 Tickets** é uma solução completa para gerenciamento de chamados de suporte técnico, desenvolvida com as mais modernas tecnologias web. O sistema oferece funcionalidades avançadas de acompanhamento de tickets, apontamento de horas, gestão de contratos e muito mais.

### ✨ Funcionalidades Principais

- 🎫 **Gerenciamento de Tickets:** Criação, edição e acompanhamento completo de chamados
- 💬 **Sistema de Respostas:** Comunicação em tempo real entre solicitantes e técnicos
- ⏱️ **Apontamento de Horas:** Registro detalhado de tempo de trabalho por técnico
- 📝 **Contratos:** Gestão de contratos de clientes com controle de horas
- 🚗 **Tipos de Deslocamento:** Registro de custos de deslocamento por região
- 📎 **Anexos:** Upload de arquivos para documentação de chamados
- 👥 **Gestão de Usuários:** Controle de permissões e papéis (Admin, Técnico, Cliente)
- 📊 **Dashboard:** Visão geral de métricas e estatísticas
- 🏷️ **Categorias e Tipos:** Organização flexível de chamados
- 🎨 **UI Moderna:** Interface responsiva e intuitiva com shadcn/ui

---

## 🛠️ Stack Tecnológica

### Backend
- **Laravel 11:** Framework PHP robusto e moderno
- **PostgreSQL 16:** Banco de dados relacional poderoso
- **Eloquent ORM:** Mapeamento objeto-relacional elegante

### Frontend
- **React 18:** Biblioteca JavaScript para interfaces de usuário
- **TypeScript 5:** Tipagem estática para maior segurança
- **Inertia.js 1.0:** Ponte entre Laravel e React (SPA sem API)
- **Tailwind CSS 3:** Framework CSS utility-first
- **shadcn/ui:** Componentes de UI acessíveis e customizáveis
- **Vite:** Build tool ultrarrápido

### Ferramentas de Desenvolvimento
- **PHP CS Fixer:** Padronização de código PHP (PSR-12)
- **ESLint + Prettier:** Padronização de código TypeScript/React
- **Git:** Controle de versão

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- PHP 8.2+
- Composer 2.x
- Node.js 20+ e NPM
- PostgreSQL 16+
- Git

### Passo a Passo

1. **Clone o repositório:**
```bash
git clone https://github.com/tbmaraujo/Sistema-Chamados.git
cd Sistema-Chamados
```

2. **Instale as dependências do PHP:**
```bash
composer install
```

3. **Instale as dependências do Node.js:**
```bash
npm install
```

4. **Configure o ambiente:**
```bash
cp .env.example .env
php artisan key:generate
```

5. **Configure o banco de dados no `.env`:**
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=sincro8_tickets
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
```

6. **Execute as migrations e seeders:**
```bash
php artisan migrate --seed
```

7. **Compile os assets:**
```bash
npm run dev
```

8. **Inicie o servidor de desenvolvimento:**
```bash
php artisan serve
```

Acesse: `http://localhost:8000`

---

## 📦 Estrutura do Projeto

```
sincro8-tickets/
├── app/
│   ├── Http/Controllers/    # Controllers da aplicação
│   ├── Models/               # Models Eloquent
│   └── Services/             # Lógica de negócio
├── database/
│   ├── migrations/           # Migrations do banco de dados
│   └── seeders/              # Seeders para dados iniciais
├── resources/
│   ├── css/                  # Estilos globais
│   └── js/
│       ├── Components/       # Componentes React reutilizáveis
│       ├── Layouts/          # Layouts da aplicação
│       ├── Pages/            # Páginas Inertia.js
│       └── Types/            # Definições TypeScript
├── routes/
│   └── web.php               # Rotas da aplicação
└── public/                   # Assets públicos
```

---

## 🎨 Padrões de Código

O projeto segue rigorosamente as convenções definidas em `regras.md`:

- **PHP:** PSR-12, snake_case para banco, PascalCase para classes
- **TypeScript/React:** PascalCase para componentes, camelCase para funções
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- **Validação:** Zod no frontend, Form Requests no backend
- **Imports:** Ordenados alfabeticamente e agrupados
- **Sem código legado:** Proibido `any`, `var`, `console.log`

---

## 📝 Scripts Disponíveis

### PHP
```bash
composer cs-fix      # Formata código PHP com PHP CS Fixer
composer cs-check    # Verifica formatação sem alterar
```

### JavaScript/TypeScript
```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run lint         # Executa ESLint com correção automática
npm run format       # Formata código com Prettier
npm run type-check   # Verifica tipagem TypeScript
npm test             # Executa testes (Vitest)
```

---

## 🚀 Deploy em Produção

Para deploy em produção (Ubuntu 24.04 + Nginx + PHP 8.3 + PostgreSQL):

### Deploy Automatizado

```bash
# No servidor
sudo bash install_and_deploy.sh all
```

**Consulte a documentação completa:**
- 📖 `Setup/README-DEPLOY.md` - Guia completo de deploy
- 🚀 `Setup/QUICKSTART.md` - Início rápido
- 📝 `Setup/.env.production.example` - Exemplo de configuração

### Recursos do Deploy

- ✅ **Releases versionadas:** Rollback instantâneo
- ✅ **Zero downtime:** Deploys sem interrupção
- ✅ **Health checks:** Validações automáticas
- ✅ **HTTPS automático:** Via Cloudflare/TrustProxies
- ✅ **Validações pré-deploy:** PostgreSQL, .env, conexão banco
- ✅ **Build otimizado:** Assets compilados com Vite

### Criar Super Admin em Produção

```bash
cd /var/www/fluxdesk/current
sudo -u www-data php artisan user:create-super-admin \
  --email=admin@fluxdesk.com.br \
  --name="Administrador" \
  --password="SuaSenhaSegura123"
```

---

## 🔐 Usuários Padrão (Desenvolvimento)

Após executar `php artisan migrate --seed`:

| Email | Senha | Papel | Super Admin |
|-------|-------|-------|-------------|
| admin@sincro8.com | password | Admin | **Sim** |
| tecnico@sincro8.com | password | Técnico | Não |

**Nota:** O admin criado via seeder tem acesso total ao menu "Plataforma" (gestão de tenants).

---

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feat/nova-funcionalidade`)
3. Commit suas mudanças seguindo Conventional Commits (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feat/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é de código proprietário. Todos os direitos reservados © 2025 Sincro8.

---

## 👨‍💻 Desenvolvedor

**Thiago Araujo**  
GitHub: [@tbmaraujo](https://github.com/tbmaraujo)

---

<p align="center">
Desenvolvido com ❤️ usando Laravel, React e TypeScript
</p>
