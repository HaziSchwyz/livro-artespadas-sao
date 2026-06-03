# Databook Oficial de Artespadas

Site estático pronto para GitHub Pages. O catálogo é renderizado a partir de `artespadas.json`, mantendo os dados das Artespadas separados do HTML, CSS e JavaScript.

## Arquivos principais

- `index.html`: estrutura da página inicial, introdução, sumário, filtros e índices.
- `style.css`: visual escuro, layout de Databook, cards ricos e modo impressão.
- `script.js`: carrega `artespadas.json`, renderiza seções/cards/índices e controla filtros.
- `artespadas.json`: fonte dos dados das Artespadas.
- `tools/generate_databook.py`: gerador local de DOCX e PDF baseado no JSON.
- `dist/`: saída gerada pelo script, com `databook-artespadas.docx` e `databook-artespadas.pdf`.

## Como editar Artespadas

Edite somente `artespadas.json` para alterar dados das Artespadas. Cada item tem campos como:

```json
{
  "id": "ART-ESP-001",
  "anchor": "art-esp-001",
  "nome": "Horizontal",
  "categoria": "Espada",
  "classe": "Novata",
  "rank": "1",
  "raridade": "Comum",
  "status": "Ativa",
  "preparacao": "Ação Menor",
  "tc": "Um Ataque",
  "pos": "Defesa Passiva -2...",
  "custo": "1",
  "dano": "Dano da arma + ATK",
  "critico": "-",
  "alcance": "Arma",
  "tipo": "Cortante",
  "descricao": "Texto da descrição.",
  "efeito": "Não informado na base fornecida.",
  "observacoes": "Texto das observações."
}
```

Para adicionar uma Artespada, copie um objeto existente, cole antes do `]` final e ajuste os campos. Mantenha `id` e `anchor` únicos.

## Recursos do site

- Página inicial estilizada.
- Introdução ao Sistema de Artespadas.
- Sumário navegável.
- Seções por categoria.
- Estatísticas por categoria.
- Cards altos com blocos de Preparação, Combate, Descrição Narrativa, Efeito Mecânico e Observações.
- Navegação anterior/próxima Artespada.
- Busca por nome.
- Filtros por categoria, classe/rank/tier e tipo.
- Botões de impressão e exportação para PDF via diálogo de impressão do navegador.

## Testar localmente

Você pode abrir `index.html` diretamente no navegador. Se o navegador bloquear `artespadas.json` usando `file://`, rode um servidor local dentro da pasta do projeto:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://127.0.0.1:8000
```

## Gerar DOCX e PDF a partir do JSON

Rode o gerador dentro da pasta do projeto:

```bash
python tools/generate_databook.py
```

Ele cria:

- `dist/databook-artespadas.docx`
- `dist/databook-artespadas.pdf`

O gerador lê `artespadas.json`. Se você editar o JSON, rode o script novamente para atualizar DOCX e PDF.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie `index.html`, `style.css`, `script.js`, `artespadas.json`, `README.md`, `tools/` e, se quiser, `dist/`.
3. Abra `Settings` > `Pages` no repositório.
4. Em `Build and deployment`, escolha `Deploy from a branch`.
5. Selecione a branch `main` e a pasta `/root`.
6. Salve e aguarde o link do GitHub Pages.

## Manutenção rápida

- Dados: edite `artespadas.json`.
- Visual: edite `style.css`.
- Estrutura fixa da página: edite `index.html`.
- Renderização e filtros: edite `script.js`.
- DOCX/PDF: rode `python tools/generate_databook.py` após editar o JSON.
