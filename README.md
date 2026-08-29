# VOLTA

Experiência imersiva e totalmente estática de passeios urbanos com rádio local. Não há banco de dados, backend, login ou coleta de dados.

O catálogo atual reúne 179 cidades: todas possuem passeio `Drive`, 120 possuem `Bike` e 129 possuem `Walk`. As modalidades são habilitadas conforme a disponibilidade de cada cidade.

## Executar localmente

Qualquer servidor de arquivos estáticos funciona. Por exemplo:

```bash
python3 -m http.server 4173
```

Depois, abra `http://localhost:4173`.

## Publicação

Envie `index.html`, `styles.css`, `cities-data.js`, `app.js` e a pasta `assets` para Netlify, Vercel, GitHub Pages ou qualquer hospedagem estática.

## Mídia

Os vídeos são incorporados do YouTube e as rádios são streams públicos externos. Portanto, a interface não precisa de servidor, mas a experiência depende de conexão com a internet e da disponibilidade dessas fontes. Navegadores exigem um clique inicial antes de reproduzir áudio.

A capa de abertura em `assets/hero-saopaulo.webp` foi criada especialmente para o projeto e permanece local.
