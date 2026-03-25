# Microsservico Redutor de URL

Aplicacao full-stack em JavaScript criada a partir do boilerplate do freeCodeCamp para o desafio "URL Shortener Microservice".

O projeto recebe uma URL valida, gera um identificador curto em memoria e depois redireciona o acesso desse identificador para a URL original.

## Funcionalidades

- Pagina inicial com formulario para envio de URLs
- Endpoint `POST /api/shorturl` para encurtar links
- Endpoint `GET /api/shorturl/:short_url` para redirecionamento
- Validacao de URL com `new URL()`
- Verificacao de hostname com `dns.lookup()`
- Resposta de erro para URLs invalidas

## Tecnologias

- Node.js
- Express
- body-parser
- cors
- dotenv

## Como executar localmente

1. Instale as dependencias:

```bash
npm.cmd install
```

2. Inicie o servidor:

```bash
npm.cmd start
```

3. Abra no navegador:

```text
http://localhost:3000
```

## Endpoints

### `GET /`

Retorna a interface HTML com o formulario para testar o encurtador.

### `POST /api/shorturl`

Recebe uma URL via `application/x-www-form-urlencoded`.

Exemplo de envio:

```text
url=https://www.freecodecamp.org/
```

Resposta de sucesso:

```json
{
  "original_url": "https://www.freecodecamp.org/",
  "short_url": 1
}
```

Resposta de erro:

```json
{
  "error": "invalid url"
}
```

### `GET /api/shorturl/:short_url`

Redireciona para a URL original associada ao identificador informado.

Exemplo:

```text
/api/shorturl/1
```

## Observacoes da implementacao

- Os links encurtados sao armazenados em memoria usando `Map`
- Os dados sao perdidos quando o servidor reinicia
- A mesma URL enviada mais de uma vez reutiliza o mesmo identificador curto
- O projeto segue a proposta do desafio do freeCodeCamp

## Estrutura principal

```text
.
|-- index.js
|-- package.json
|-- public/
|   `-- style.css
`-- views/
    `-- index.html
```

## Status

Projeto funcional para desenvolvimento local e adaptado ao desafio de microsservico redutor de URL.
