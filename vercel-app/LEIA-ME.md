# Social Selling Impulso: como colocar no ar

São três partes, feitas uma vez só.

## 1. Ligar a planilha ao app (Apps Script)

1. Abra a planilha **Controle Social Selling - Ana** no Google Sheets.
2. Menu **Extensões > Apps Script**.
3. Apague o que estiver no editor e cole todo o conteúdo de `apps-script/Codigo.gs`.
4. Na linha `const CHAVE = 'troque-esta-chave';`, troque o texto por uma senha sua (por exemplo `impulso-ana-7391`). A Ana vai digitar essa chave no app.
5. Clique em **Salvar**.
6. Clique em **Implantar > Nova implantação**. Na engrenagem, escolha **App da Web**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
7. Clique em **Implantar**, autorize com sua conta Google e copie o **URL do app da Web** (termina em `/exec`).

Se um dia você mudar o script, use **Implantar > Gerenciar implantações > Editar > Nova versão**. Assim o endereço continua o mesmo.

## 2. Subir o site no Vercel

Opção sem programar (pelo navegador):
1. Crie um repositório no GitHub e envie esta pasta inteira (botão **Add file > Upload files**).
2. No Vercel, **Add New > Project**, escolha o repositório e clique em **Deploy**. Não precisa mudar nenhuma configuração: o `vercel.json` já aponta para a pasta `public`.

Opção pelo terminal:
```
npm i -g vercel
cd vercel-app
vercel --prod
```

## 3. Primeiro acesso da Ana

1. Ela abre o endereço do Vercel no celular.
2. Cola o URL do Apps Script e digita a chave. O app guarda isso no celular dela.
3. Para virar um ícone na tela inicial:
   - iPhone (Safari): **Compartilhar > Adicionar à Tela de Início**.
   - Android (Chrome): menu **⋮ > Adicionar à tela inicial**.

Dica: para ela não precisar colar o URL, abra `public/index.html`, procure `const DEFAULT_API_URL=""` e cole o endereço entre as aspas antes de subir. A chave continua sendo pedida, para que só quem sabe a chave consiga ler e gravar.

## Como funciona

- Cada alteração no app é gravada direto nas abas **Diária**, **Registro SS** e **Painel SS** (metas).
- Na Diária, o app só escreve nas colunas de preencher (Ativados, Convert., Gerado, CRM, Relatório). As linhas SEM e as taxas continuam com as fórmulas da planilha.
- No Registro SS, cada pessoa ocupa uma linha a partir da linha 5. Não reordene nem apague linhas na planilha à mão: para tirar alguém, use **Excluir registro** no app, ou mude a etapa para Perdido.
- Sem internet, o app guarda as alterações no celular e envia sozinho quando a conexão volta.
- Ao abrir o app, ele lê a planilha. Então o que for editado direto na planilha também aparece no app.
