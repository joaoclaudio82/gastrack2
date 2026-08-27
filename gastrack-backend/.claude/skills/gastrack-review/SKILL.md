---
name: gastrack-review
description: Use ao revisar mudanças do GasTrack — backend Spring/JPA/Flyway e frontend Angular, incluindo as invariantes do domínio de gás (linha, cilindro, sensor, kit, multi-tenant). Despacha um agente de review por área e um verificador por relatório.
---

# Review do GasTrack

Review multiagente com verificação. **Você orquestra**: lê o panorama do diff, escolhe as áreas,
despacha um agente por área em paralelo, e depois manda um verificador conferir cada achado
contra o diff real.

Achado não verificado não entra no relatório final.

## 1. Reunir o diff

O diretório raiz **não é repositório git**. `gastrack-backend` e `gastrack-frontend` são repos
independentes — colete os dois e junte num arquivo só.

Rode a partir da raiz do gastrack (a pasta que contém `gastrack-backend/`). Confirme antes:

```bash
ls -d gastrack-backend gastrack-frontend   # se falhar, você está no diretório errado
```

```bash
ROOT=$(pwd)
OUT=/tmp/gastrack-review

mkdir -p "$OUT"
: > "$OUT/diff.patch"
: > "$OUT/files.txt"

for proj in gastrack-backend gastrack-frontend; do
  d="$ROOT/$proj"
  [ -d "$d/.git" ] || continue
  {
    echo "===== $proj — branch $(git -C "$d" rev-parse --abbrev-ref HEAD) ====="
    git -C "$d" diff HEAD
    # arquivos novos ainda não rastreados também são mudança
    git -C "$d" ls-files --others --exclude-standard | while read -r f; do
      echo "===== NOVO: $proj/$f ====="
      cat "$d/$f"
    done
  } >> "$OUT/diff.patch"

  git -C "$d" diff HEAD --name-only | sed "s|^|$proj/|" >> "$OUT/files.txt"
  git -C "$d" ls-files --others --exclude-standard | sed "s|^|$proj/|" >> "$OUT/files.txt"
done

wc -l "$OUT/diff.patch" "$OUT/files.txt"
```

Comparar contra outra base (`git diff main...HEAD`) quando o usuário pedir. **Diff vazio: pare** —
não há o que revisar. Diga isso e ofereça revisar arquivos específicos que o usuário indicar.

## 2. Escolher as áreas

Leia `files.txt` e agrupe por superfície. Escolha **3 a 5 áreas que cobrem o que mudou**, sem
sobreposição. Não use um conjunto fixo.

| Se o diff toca… | Área provável | Seção de `criteria.md` |
|---|---|---|
| `model/`, `PontoGas`, `Cylinder`, derivações | Domínio e invariantes de gás | `dominio` |
| `db/migration/`, entidades, `repository/` | Persistência, migrations e consultas | `persistencia` |
| `controller/`, `dto/`, `mapper/` | Fronteira de API e mapeamento | `api` |
| `security/`, `TenantSecurityService`, `@PreAuthorize` | Multi-tenant e autorização | `tenant` |
| `GasPointReadingSyncJob`, `dynamodb/`, `@Scheduled` | Ingestão de leitura e agendamento | `ingestao` |
| `features/`, `components/`, `*.component.ts` | Frontend Angular | `frontend` |
| `core/services/`, `models/` | Contrato cliente–servidor | `api`, `frontend` |
| `*Test.java`, `*.spec.ts` | Cobertura e qualidade de teste | `testes` |

Se o diff for pequeno e homogêneo, duas áreas bastam. Diff só de documentação não precisa de
review multiagente — leia você mesmo e responda.

## 3. Despachar os agentes de review

Um agente **por área**, todos em **uma única mensagem** com várias chamadas de Task, para
rodarem de fato em paralelo.

Use `review-agent-prompt.md` preenchendo:
`<AREA>`, `<FOCO>`, `<SECAO_CRITERIOS>`, `<DIFF>`, `<ARQUIVOS>`, `<BRANCHES>`

```
Task: subagent_type "general-purpose", run_in_background true
```

**Não resuma as convenções dentro do prompt.** O agente lê `gastrack-backend/CONVENTIONS.md`,
`gastrack-backend/ARCHITECTURE.md` e o `CLAUDE.md` do projeto por conta própria. Resumo é cópia, e
cópia envelhece. Para mudar o que o review procura, edite `criteria.md` — não este arquivo.

## 4. Verificar

Quando cada review voltar, despache um verificador com `verification-agent-prompt.md`. Ele
confere cada achado contra o diff real e marca o que não se sustenta.

O verificador também procura o que passou batido na área dele. O que ele achar entra no
relatório marcado como adição da verificação.

## 5. Apresentar

Por área: achados confirmados (ordenados por severidade), achados rejeitados com o motivo, e o
que a verificação acrescentou.

Termine com uma seção única: **os achados que bloqueiam**, somando todas as áreas.

Reconheça o que está certo — decisão deliberada bem tomada, armadilha evitada. Review só de
crítica vira ruído e esconde o que importa.

### Severidade

| Nível | Critério |
|---|---|
| **Bloqueia** | Corrompe dado, fura tenant, quebra invariante do domínio, ou perde leitura |
| **Corrigir** | Bug real com impacto limitado, ou convenção violada com consequência prática |
| **Vale olhar** | Melhoria de clareza, cobertura de teste, custo de query |

## Sinais de que o review está mal feito

- Revisar as áreas em sequência em vez de agentes paralelos
- Pular a verificação "para ganhar tempo"
- Achado sem caminho de arquivo e linha
- Achado sem cenário concreto — "inputs X levam a Y errado"
- Ler o diff inteiro você mesmo em vez de delegar
- Coletar só um dos dois repositórios
- Usar as mesmas áreas genéricas independentemente do que mudou
- Inlinar as convenções no prompt em vez de deixar o agente lê-las
