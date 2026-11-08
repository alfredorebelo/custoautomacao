# CustoAutomação

Revisão privada de uma calculadora que compara Zapier, Make e n8n sem tratar tarefas, créditos e execuções como se fossem a mesma coisa. O texto está em português europeu.

Ainda não está lançado. Não há estatísticas de audiência, patrocinador, domínio de correio verificado nem publicação. Esta cópia não deve ser colocada na Vercel: a conta pessoal é Hobby e o uso comercial não cabe nesse plano.

## O que está feito

- Página inicial com calculadora utilizável, também sem base de dados e sem segredos.
- Catálogo com pesquisa e filtros, ficha de cada entrada, comparação e metodologia.
- Primeira fotografia de preços em `src/data/snapshot.ts`, observada a 8 de novembro de 2026. Não há preços anteriores.
- Diferença entre leituras em `src/lib/snapshot-diff.ts`, pronta para uma segunda fotografia.
- Newsletter em dois passos e cancelamento preparados para Resend Broadcasts. Sem configuração, o formulário fica desligado e não diz que o pedido foi aceite.
- Patrocínio proposto a 49 € por semana, PVP com IVA incluído. É um preço pedido, não receita. A lista de redirecionamentos `/go` está vazia.
- Fila de sugestões, vistas, pesquisas sem resultado, cliques e erros, com migração Postgres em `db/migrations/001_init.sql`.
- Rotas de administração fechadas se `ADMIN_TOKEN` não existir.

## O que falta configurar

Nomes, sem valores, em `.env.example`:

- `DATABASE_URL` para o Postgres.
- `ADMIN_TOKEN` para `GET /api/admin/queue`, `POST /api/admin/approve`, `GET /api/admin/stats`, `GET /api/admin/searches` e `GET /api/admin/sponsors`.
- `RESEND_API_KEY`, `RESEND_FROM` e `RESEND_SEGMENT_ID` para a confirmação e para o segmento do Broadcast.
- `RESEND_WEBHOOK_SECRET` fica reservado; o webhook ainda não está ligado.
- `NEXT_PUBLIC_SITE_URL` para os endereços canónicos. Enquanto estiver vazio, a metadados usam `http://localhost:3000`.

Aplicar a migração à mão quando o Postgres existir. A memória do processo não substitui a base e não é tratada como gravação feita.

O Broadcast semanal, quando for enviado de verdade, tem de incluir `{{{RESEND_UNSUBSCRIBE_URL}}}`. O rascunho em `src/lib/broadcast.ts` recusa texto sem essa ligação e não envia (`send: false`).

## O que ainda não está no ar

- Envio de correio e domínio verificado.
- Patrocinador, semanas vendidas e cliques reais.
- Segunda leitura de preços.
- Indexação: as páginas levam `noindex` enquanto a revisão não for lançada.
- Publicação em qualquer alojamento.

## Preços desta leitura

Os números vêm das páginas oficiais obtidas a 8 de novembro de 2026. A Zapier está em USD, com a tabela self-serve completa. O n8n está em euros, a partir do HTML de `https://n8n.io/pricing/`. Os cartões de preço da Make não vieram no texto de `https://www.make.com/pricing`; o blog de agosto e um exemplo da ajuda não coincidem, por isso Core, Pro e Teams ficam de fora da recomendação.

Nenhum preço de fornecedor é apresentado como PVP. O imposto não vinha nas fichas. Não há taxa de câmbio. Self-hosted não é tratado como gratuito: a licença Community custa zero de software e o alojamento só entra se for indicado.

## Comandos

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
```

Não há passo de deploy.
