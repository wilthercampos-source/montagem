# MontaView Enterprise — API (Sprint 01 + Sprint 02)

Backend em **Node.js + TypeScript + Express + PostgreSQL (Prisma)**.

## Escopo — Sprint 01

- **Login**: autenticação com JWT, bloqueio após tentativas incorretas, notificação automática ao Usuário Master em tentativas repetidas após o bloqueio.
- **Criar conta**: primeiro cadastro de uma empresa cria automaticamente o Usuário Master.
- **Usuários**: CRUD com perfis (`USUARIO_MASTER`, `GESTOR`, `ANALISTA`, `OPERADOR`), status e permissões por hierarquia de perfil.
- **Configurações**: dados da empresa, aparência/White Label (tema + 5 cores) e política de segurança (tentativas máximas / tempo de bloqueio), todas configuráveis por empresa (multi-tenant).
- **Auditoria**: toda ação sensível é registrada de forma imutável.
- **Banco**: schema Prisma com UUID em todas as tabelas, particionado por `empresaId` (tenant).

## Escopo — Sprint 02

- **Importações**: upload de arquivos das rotinas `901`, `8072` e `8268` (CSV/TXT, até 10MB).
- **Validação**: cada rotina tem um contrato de colunas obrigatórias (`imports.config.ts`); arquivos fora do padrão são marcados como `ERRO` com o motivo registrado.
- **Processamento**: importações `VALIDADO` podem ser processadas, gerando um **Snapshot** imutável (`SNAP-XXXX`) com os dados consolidados.
- **Histórico**: listagem de todas as importações por empresa, com status, total de registros e snapshot gerado.
- Todo o ciclo (upload, validação, processamento) gera entradas de **Auditoria**.

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite DATABASE_URL com sua conexão PostgreSQL e gere um JWT_SECRET forte

# 3. Criar as tabelas no banco
npm run prisma:migrate

# 4. (Opcional) Popular com dados de teste
npm run prisma:seed
# login: renata.souza@montaview.com / senha: montaview

# 5. Subir o servidor em modo desenvolvimento
npm run dev
```

A API sobe em `http://localhost:3333`. Verifique com `GET /health`.

## Rotas principais

| Método | Rota                              | Perfil mínimo   | Descrição                                |
|--------|-----------------------------------|-----------------|--------------------------------------------|
| POST   | `/api/auth/criar-conta`           | público         | Cria empresa + Usuário Master              |
| POST   | `/api/auth/login`                 | público         | Autentica e retorna JWT                    |
| GET    | `/api/usuarios`                   | qualquer logado | Lista usuários da empresa                  |
| POST   | `/api/usuarios`                   | Gestor          | Cria usuário                               |
| PATCH  | `/api/usuarios/:id`                | Gestor          | Atualiza usuário                           |
| DELETE | `/api/usuarios/:id`                | Usuário Master  | Remove usuário                             |
| GET    | `/api/configuracoes`              | qualquer logado | Retorna dados da empresa                   |
| PATCH  | `/api/configuracoes/empresa`      | Gestor          | Atualiza nome/logo/unidade/idioma/moeda    |
| PATCH  | `/api/configuracoes/aparencia`    | Gestor          | Atualiza tema e cores (White Label)        |
| PATCH  | `/api/configuracoes/seguranca`    | Usuário Master  | Atualiza política de bloqueio de login     |
| GET    | `/api/auditoria`                  | Gestor          | Lista histórico de auditoria               |
| GET    | `/api/importacoes`                | qualquer logado | Lista histórico de importações             |
| POST   | `/api/importacoes/upload`         | Analista        | Upload + validação (`multipart/form-data`: campos `arquivo`, `rotina`) |
| POST   | `/api/importacoes/:id/processar`  | Analista        | Processa importação validada → gera Snapshot |

Todas as rotas autenticadas exigem o header `Authorization: Bearer <token>`.

### Exemplo — upload de importação

```bash
curl -X POST http://localhost:3333/api/importacoes/upload \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "rotina=ROTINA_8072" \
  -F "arquivo=@8072_montagem.csv"
```

## Decisões de arquitetura

- **Multi-tenant por `empresaId`**: toda tabela relevante referencia a empresa, preparando o sistema para operar com múltiplas transportadoras (SaaS).
- **Auditoria e Snapshots nunca são apagados**: segue a regra "Motor Histórico" do projeto.
- **Validação por contrato de colunas** (`imports.config.ts`): cada rotina do ERP define suas colunas obrigatórias, centralizando a regra de negócio e facilitando adicionar novas rotinas no futuro.
- **Permissões por hierarquia** (`OPERADOR < ANALISTA < GESTOR < USUARIO_MASTER`); a especificação pede também "permissões individuais", planejado como uma tabela `PermissaoIndividual` em sprint futuro.
- **Alias de import `@/...`**: aponta para `src/`. Resolvido em dev pelo `tsx` e em build pelo `tsc-alias`.

## Próximos Sprints (não incluídos aqui)

Sprint 03 (Dashboard/Prévia/Pré-Prévia), Sprint 04 (Inteligência/Alertas/Timeline), Sprint 05 (Replay/Painel TV/Relatórios), Sprint 06 (Monta AI/Simulações/Integrações) — conforme o cronograma definido no prompt mestre.

## Escopo — Sprint 03

- **Dashboard** (`GET /api/dashboard`): Saúde Operacional, Percentual Geral, Meta Inteligente, Previsão de Encerramento, Confiabilidade, Radar Operacional, Ranking, Alertas, Resumo IA, Comparativo (hoje x snapshot anterior) e Linha do Tempo (via Auditoria).
- **Prévia** (`GET /api/dashboard/previa`): status da operação atual por cidade, com resumo (em andamento / concluídas / atrasadas).
- **Pré-Prévia** (`GET /api/dashboard/preprevia`): planejamento do dia seguinte, lido exclusivamente da Rotina 901 filtrando por `dataProgramada`, **nunca cruzando com a operação atual**.
- Todos os três endpoints leem os **Snapshots** gerados no Sprint 02 (nunca recalculam a partir de dados brutos fora do histórico).

### ⚠️ Nota arquitetural importante

Os cálculos de **Meta Inteligente, Previsão de Encerramento e Confiabilidade** estão isolados em `src/modules/dashboard/decision-engine.ts` como uma versão **heurística e temporária**. O prompt mestre define o **Motor de Decisão** completo (histórico de 30 dias, DNA Operacional, Insights de IA) como escopo do **Sprint 04** (Inteligência Operacional). A interface dessas funções foi desenhada para ser substituída sem alterar as rotas ou o frontend — apenas o conteúdo de `decision-engine.ts` muda.

| Método | Rota                        | Perfil mínimo   | Descrição                          |
|--------|-----------------------------|-----------------|--------------------------------------|
| GET    | `/api/dashboard`            | qualquer logado | Dashboard executivo completo         |
| GET    | `/api/dashboard/previa`     | qualquer logado | Operação atual por cidade            |
| GET    | `/api/dashboard/preprevia`  | qualquer logado | Planejamento do dia seguinte         |

Se as rotinas 901 e 8072 ainda não tiverem sido importadas (Sprint 02), esses endpoints retornam `{ possuiDados: false, mensagem: "..." }` em vez de erro, para o frontend orientar o usuário a importar os dados primeiro.

## Escopo — Sprint 04

- **Alertas** (`GET /api/alertas`, `PATCH /api/alertas/:id/resolver`): persistidos no banco (não recalculados a cada request). Gerados automaticamente a partir do Dashboard quando uma cidade foge da meta, evitando duplicar alertas já ativos para a mesma cidade. Resolução manual registra quem resolveu e quando.
- **Motor de IA** (`POST /api/inteligencia/perguntar`): responde perguntas em linguagem natural sobre a operação (`"Qual cidade está mais atrasada?"`, `"Que horas termina?"`, `"Qual carga exige prioridade?"`, `"Compare hoje com ontem"`) usando os dados já agregados do Dashboard. Implementado por correspondência de palavras-chave (`ai.service.ts`) — arquitetura pronta para trocar por um LLM real sem mudar o contrato da rota.
- **DNA Operacional** (`GET /api/inteligencia/dna-operacional`): cidade mais consistente, cidade mais variável e taxa média de atraso, calculados sobre os últimos 30 dias de `IndicadorDiario`.
- **Meta Inteligente e Confiabilidade** (usadas em `/api/dashboard`): evoluíram do placeholder fixo do Sprint 03 para um cálculo real sobre o histórico de 30 dias (`decision-engine-v2.ts`), com fallback automático para a heurística do Sprint 03 enquanto não houver histórico suficiente.
- **`IndicadorDiario`**: nova tabela, alimentada automaticamente sempre que uma importação da **Rotina 8268** (fechamento) é processada (ver `imports.service.ts` → `registrarIndicadoresDoFechamento`). É a base de dados histórica de todo o Sprint 04.
- **Timeline** (`GET /api/timeline?tipo=importacao|alerta|operacao|sistema`): feed cronológico unificado, combinando Auditoria e eventos de Alerta em uma única linha do tempo com descrições legíveis.

| Método | Rota                              | Perfil mínimo   | Descrição                                  |
|--------|------------------------------------|-----------------|-----------------------------------------------|
| GET    | `/api/alertas?filtro=ativos`       | qualquer logado | Lista alertas (ativos/resolvidos/todos)       |
| PATCH  | `/api/alertas/:id/resolver`        | Analista        | Marca um alerta como resolvido                |
| POST   | `/api/inteligencia/perguntar`      | qualquer logado | Motor de IA — pergunta em linguagem natural   |
| GET    | `/api/inteligencia/dna-operacional`| qualquer logado | DNA Operacional (histórico de 30 dias)        |
| GET    | `/api/timeline`                    | qualquer logado | Feed cronológico unificado                    |

### Fluxo de ponta a ponta para gerar histórico

1. Fazer upload + processar a Rotina 8268 (`POST /api/importacoes/upload` → `POST /api/importacoes/:id/processar`) todo fim de dia.
2. Cada processamento gera 1 `IndicadorDiario` por cidade automaticamente.
3. Após alguns dias de histórico, `/api/dashboard` e `/api/inteligencia/dna-operacional` passam a refletir dados reais em vez do fallback do Sprint 03.

## Escopo — Sprint 05

- **Replay** (`GET /api/replay?timestamp=ISO8601`, `GET /api/replay/momentos`): reconstrói o estado da operação em qualquer instante do dia. Não criamos uma tabela nova — reaproveitamos o histórico de Snapshots da Rotina 8072 do Sprint 02 (cada importação processada ao longo do dia já é, na prática, um ponto no tempo). O Replay escolhe o snapshot mais recente até o instante pedido.
- **Painel TV** (`GET /api/painel-tv`): projeção enxuta do Dashboard (Sprint 03), sem os campos que uma tela sem interação não precisa (resumo textual longo, comparativos detalhados). Não duplica lógica de agregação — qualquer melhoria no Dashboard reflete aqui automaticamente. O modo "sem menus / sem interação" é uma decisão do frontend, não uma rota pública separada; a rota continua autenticada.
- **Relatórios**:
  - `GET /api/relatorios/excel` — gera um `.xlsx` real (via `exceljs`) com abas de indicadores gerais e detalhamento por cidade.
  - `GET /api/relatorios/pdf` — gera um `.pdf` real (via `pdfkit`) com o mesmo conteúdo.
  - `GET /api/relatorios/png` — **não implementado nesta versão**, retorna `501` com explicação (ver nota abaixo).
  - Toda exportação é registrada em Auditoria (`EXPORTACAO_REALIZADA`).

### ⚠️ Nota arquitetural — exportação em PNG

Excel e PDF são gerados a partir de **dados tabulares**, o que `exceljs`/`pdfkit` fazem nativamente. PNG, no contexto do prompt mestre, significa exportar a **aparência visual** do Dashboard (cards, gráficos, cores do White Label) — isso não dá para gerar a partir de dados brutos no backend. A abordagem correta é renderizar a página do frontend em um navegador headless (ex: **Puppeteer** ou **Playwright**) e tirar um screenshot server-side. Isso é uma peça de infraestrutura adicional (processo Chromium no servidor, maior custo de memória/CPU) que vale decidir conscientemente antes de implementar — por isso deixei sinalizado em vez de simular um sucesso falso. Posso implementar no Sprint 06 se você confirmar que quer seguir por esse caminho.

| Método | Rota                     | Perfil mínimo   | Descrição                                      |
|--------|--------------------------|-----------------|---------------------------------------------------|
| GET    | `/api/replay/momentos`   | qualquer logado | Lista os instantes com snapshot disponível no dia |
| GET    | `/api/replay`            | qualquer logado | Estado da operação em um instante (`?timestamp=`) |
| GET    | `/api/painel-tv`         | qualquer logado | Projeção enxuta do Dashboard para telão           |
| GET    | `/api/relatorios/excel`  | qualquer logado | Download do relatório em Excel                    |
| GET    | `/api/relatorios/pdf`    | qualquer logado | Download do relatório em PDF                      |
| GET    | `/api/relatorios/png`    | qualquer logado | `501` — não implementado (ver nota acima)          |

## Escopo — Sprint 06 (fecha o roadmap do prompt mestre)

- **Simulações** (`POST /api/simulacoes`): cenários "e se" (reforço de equipe + ajuste de Meta Inteligente) calculados sobre os dados reais do Dashboard. **Nunca escreve** em `Importacao`, `Snapshot` ou `IndicadorDiario` — é só um cálculo hipotético, registrado em Auditoria (`SIMULACAO_EXECUTADA`) por ser uma decisão de negócio relevante.
- **Integrações** (`GET /api/integracoes`, `PATCH /api/integracoes/:tipo/alternar`, `PATCH /api/integracoes/:tipo/configuracao`): ERP, WhatsApp, E-mail, Power BI e Webhooks. Cada empresa recebe as 5 linhas automaticamente (desconectadas por padrão) na primeira consulta.
  - **Webhooks são reais**: quando a integração `WEBHOOK` está conectada e tem uma `url` configurada, o sistema dispara um `POST` de verdade nos eventos `alerta.gerado` e `importacao.concluida` (`webhook.dispatcher.ts`). Falha de rede no webhook nunca derruba o fluxo principal.
  - WhatsApp, E-mail e Power BI ficam com a estrutura de configuração pronta (`configuracao: Json`), mas sem o disparo real implementado — isso exigiria credenciais de provedores externos (ex: Twilio/Meta Cloud API, SMTP, Power BI REST API), que são uma decisão de infraestrutura e custos para você validar antes de eu integrar de verdade.
- **Monta AI** (`POST /api/monta-ai/perguntar`): diferente do Motor de IA (Sprint 04, que só responde), o Monta AI interpreta a intenção e **executa uma ação real** quando aplicável — por exemplo, rodar uma simulação de fato via `simulations.service` — antes de responder. Quando não reconhece uma ação, cai automaticamente para o Motor de IA do Sprint 04.

| Método | Rota                                  | Perfil mínimo   | Descrição                                    |
|--------|----------------------------------------|-----------------|--------------------------------------------------|
| POST   | `/api/simulacoes`                      | qualquer logado | Roda um cenário hipotético                       |
| GET    | `/api/integracoes`                     | qualquer logado | Lista as integrações e seus status               |
| PATCH  | `/api/integracoes/:tipo/alternar`      | Gestor          | Conecta/desconecta uma integração                |
| PATCH  | `/api/integracoes/:tipo/configuracao`  | Gestor          | Atualiza a configuração (ex: URL do webhook)      |
| POST   | `/api/monta-ai/perguntar`              | qualquer logado | Assistente com ações (simulação, apontar relatório) |

### Exemplo — configurar e testar um webhook

```bash
curl -X PATCH http://localhost:3333/api/integracoes/WEBHOOK/configuracao \
  -H "Authorization: Bearer SEU_TOKEN" -H "Content-Type: application/json" \
  -d '{"configuracao": {"url": "https://webhook.site/SEU-ENDPOINT"}}'

curl -X PATCH http://localhost:3333/api/integracoes/WEBHOOK/alternar \
  -H "Authorization: Bearer SEU_TOKEN"
```

A partir daqui, qualquer alerta gerado ou importação concluída dispara um `POST` real para a URL configurada.

---

## Roadmap completo — status final

| Sprint | Escopo do prompt mestre                          | Status |
|--------|---------------------------------------------------|--------|
| 01     | Login, Usuários, Configurações, Banco              | ✅ Completo |
| 02     | Importações, Processamento, Histórico              | ✅ Completo |
| 03     | Dashboard, Prévia, Pré-Prévia                      | ✅ Completo |
| 04     | Inteligência, Alertas, Timeline                    | ✅ Completo |
| 05     | Replay, Painel TV, Relatórios                      | ✅ Completo (PNG pendente — ver nota) |
| 06     | Monta AI, Simulações, Integrações                  | ✅ Completo (WhatsApp/E-mail/Power BI: estrutura pronta, disparo real pendente de credenciais) |

### Pendências conscientes para uma v2 (fora do escopo literal do prompt mestre, registradas para transparência)

1. **Permissões individuais** por usuário (hoje é só hierarquia de perfil).
2. **Exportação em PNG** — requer navegador headless (Puppeteer/Playwright).
3. **Motor de IA real** (LLM) no lugar da versão por palavras-chave do Sprint 04/06.
4. **Job agendado** para geração de Alertas (hoje é sob demanda, ao abrir a tela).
5. **Disparo real** de WhatsApp/E-mail/Power BI (estrutura de configuração pronta, falta a integração com os provedores externos).
