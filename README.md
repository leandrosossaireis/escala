# Escala Fácil Pro — Controle Operacional de Equipes, Serviços e Dias Trabalhados

Sistema web completo e **100% livre de limites de tokens** para gestão de escalas de trabalho em regime de rodízio — equipes de **campo** (duplas) e **atendimento**, plantões de domingo e feriado, trocas, férias, ausências, **lançamento diário de serviços/OS** e **contagem individualizada de dias trabalhados por funcionário**.

---

## Funcionalidades

### 1. Calendário Público e Painel de Consulta (`/`)
- **Visão Mês**: Grade mensal (segunda a domingo) com cores configuráveis por situação (`Trabalha`, `Folga`, `Plantão de domingo`, `Plantão de feriado`, `Troca de plantão`, `Feriado`, `Alteração`, `Férias`, `Ausência`), destaque do dia atual e indicação de serviços realizados no dia.
- **Visão Equipes**: Matriz diária em linha do tempo por equipe (dividida entre **Equipe de Campo** e **Atendimento**) com indicadores visuais de grupo (`A` / `B`).
- **Visão Dias por Funcionário**: Desmembramento automático das duplas (`Lucas / Felipe`, `Facão / Alison`, `Tilú / Fernando`, `Welliton / Igor`, `Guto / Sasa`, `Bigode / Eduardo`, `Alex`, `João`, `Leandro`, `Victor`), contabilizando dias normais, plantões de domingo, plantões de feriado, trocas nominais, férias/ausências, folgas e ordens de serviço executadas.
- **Visão Serviços (OS)**: Lançamento rápido e histórico mensal de serviços/atendimentos realizados por cada equipe e funcionário.
- **Modal de Detalhes do Dia**: Ao clicar em qualquer dia do calendário, exibe a situação de todas as equipes naquele dia e permite registrar serviços rapidamente.

### 2. Painel Administrativo (`Administrar`)
- **Escala**: Configuração da semana de referência do rodízio, grupo âncora (`A` ou `B`), início da rotação, inversão de semana específica, definição manual de plantão de domingo e escolha do domingo de folga do titular do Atendimento (`Mateus`).
- **Equipes**: Cadastro, edição inline, ordenação, ativação/inativação e exclusão de equipes de campo e atendimento.
- **Feriados**: Cadastro manual e importador automático de todos os feriados nacionais e pontos facultativos de qualquer ano.
- **Trocas e Ajustes**: Troca de plantão com nome personalizado no calendário, troca de dia entre duas equipes, permuta de plantões entre domingos/feriados, ajustes pontuais e gestão de férias/ausências por período.
- **Serviços e Diárias**: Cadastro e listagem geral de ordens de serviço e atendimentos.
- **Cores**: Personalização de todas as cores do calendário e restauração para o padrão original.
- **Relatórios**: Resumo mensal por equipe, relatório individual por funcionário, lista de plantões do mês, exportação para **CSV (Excel)**, impressão e Backup/Restauração em JSON.

---

## Como executar localmente

```bash
npm install
npm run dev
```
