/**
 * Social Selling Impulso: ponte entre o app (Vercel) e esta planilha.
 *
 * Como instalar (uma vez só):
 * 1. Na planilha, abra Extensões > Apps Script.
 * 2. Apague o que estiver no editor e cole este arquivo inteiro.
 * 3. Troque a CHAVE abaixo por uma senha só sua (ela será digitada no app).
 * 4. Clique em Implantar > Nova implantação > tipo "App da Web".
 *    Executar como: Eu. Quem pode acessar: Qualquer pessoa.
 * 5. Autorize e copie o endereço que termina em /exec. Ele vai no app.
 */

const CHAVE = 'troque-esta-chave';

const ABA_DIARIA = 'Diária';
const ABA_REGISTRO = 'Registro SS';
const ABA_PAINEL = 'Painel SS';
const PRIMEIRA_LINHA_DIARIA = 8;
const PRIMEIRA_LINHA_REGISTRO = 5;

function doGet(e) {
  return responder(function () {
    checar(e.parameter.chave);
    return carregar();
  });
}

function doPost(e) {
  return responder(function () {
    const corpo = JSON.parse(e.postData.contents);
    checar(corpo.chave);
    return gravar(corpo);
  });
}

function responder(fn) {
  let saida;
  try {
    saida = { ok: true, dados: fn() };
  } catch (err) {
    saida = { ok: false, erro: String((err && err.message) || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(saida)).setMimeType(ContentService.MimeType.JSON);
}

function checar(chave) {
  if (!chave || chave !== CHAVE) throw new Error('chave_invalida');
}

function fuso() {
  return SpreadsheetApp.getActive().getSpreadsheetTimeZone();
}

function paraTexto(v) {
  return v instanceof Date ? Utilities.formatDate(v, fuso(), 'yyyy-MM-dd') : '';
}

function paraData(k) {
  if (!k) return '';
  const p = String(k).split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12);
}

function aba(nome) {
  const a = SpreadsheetApp.getActive().getSheetByName(nome);
  if (!a) throw new Error('aba_nao_encontrada: ' + nome);
  return a;
}

/* ---------- Leitura ---------- */
function carregar() {
  const diaria = aba(ABA_DIARIA);
  const ultima = diaria.getLastRow();
  const dias = {};
  if (ultima >= PRIMEIRA_LINHA_DIARIA) {
    const vals = diaria.getRange(PRIMEIRA_LINHA_DIARIA, 2, ultima - PRIMEIRA_LINHA_DIARIA + 1, 8).getValues(); // B..I
    vals.forEach(function (r) {
      if (!(r[0] instanceof Date)) return; // linhas SEM
      const a = Number(r[1]) || 0, c = Number(r[3]) || 0, g = Number(r[5]) || 0;
      const crm = r[6] === 'Sim', rel = r[7] === 'Sim';
      if (a || c || g || crm || rel) dias[paraTexto(r[0])] = { ativ: a, conv: c, ger: g, crm: crm, rel: rel };
    });
  }

  const reg = aba(ABA_REGISTRO);
  const ultReg = reg.getLastRow();
  const pessoas = [];
  if (ultReg >= PRIMEIRA_LINHA_REGISTRO) {
    const linhas = reg.getRange(PRIMEIRA_LINHA_REGISTRO, 1, ultReg - PRIMEIRA_LINHA_REGISTRO + 1, 12).getValues();
    linhas.forEach(function (r, i) {
      if (!String(r[1]).trim()) return;
      pessoas.push({
        linha: PRIMEIRA_LINHA_REGISTRO + i,
        data1: paraTexto(r[0]), nome: String(r[1]), contato: String(r[2]), gatilho: String(r[3]),
        dataAtiv: paraTexto(r[4]), respondeu: String(r[5]), dataResp: paraTexto(r[6]), etapa: String(r[7]),
        followup: String(r[8]), callData: paraTexto(r[9]), motivo: String(r[10]), obs: String(r[11])
      });
    });
  }

  const metas = aba(ABA_PAINEL).getRange('C5:C6').getValues();
  return { dias: dias, pessoas: pessoas, metaDia: Number(metas[0][0]) || 0, metaMes: Number(metas[1][0]) || 0 };
}

/* ---------- Gravação ---------- */
function gravar(b) {
  const trava = LockService.getScriptLock();
  trava.waitLock(15000);
  try {
    if (b.op === 'dia') return gravarDia(b);
    if (b.op === 'pessoa') return gravarPessoa(b);
    if (b.op === 'apagar') return apagarPessoa(b);
    if (b.op === 'metas') {
      aba(ABA_PAINEL).getRange('C5:C6').setValues([[Number(b.metaDia) || 0], [Number(b.metaMes) || 0]]);
      return {};
    }
    throw new Error('operacao_desconhecida');
  } finally {
    trava.releaseLock();
  }
}

function linhaDoDia(k) {
  const diaria = aba(ABA_DIARIA);
  const ultima = diaria.getLastRow();
  const datas = diaria.getRange(PRIMEIRA_LINHA_DIARIA, 2, ultima - PRIMEIRA_LINHA_DIARIA + 1, 1).getValues();
  for (let i = 0; i < datas.length; i++) {
    if (datas[i][0] instanceof Date && paraTexto(datas[i][0]) === k) return PRIMEIRA_LINHA_DIARIA + i;
  }
  throw new Error('dia_fora_do_periodo');
}

function gravarDia(b) {
  const r = linhaDoDia(b.data);
  const diaria = aba(ABA_DIARIA);
  const n = function (v) { return Number(v) > 0 ? Number(v) : ''; };
  // Só as colunas de preencher: as de % (D e F) têm fórmula e ficam intactas.
  diaria.getRange(r, 3).setValue(n(b.ativ));
  diaria.getRange(r, 5).setValue(n(b.conv));
  diaria.getRange(r, 7, 1, 3).setValues([[n(b.ger), b.crm ? 'Sim' : 'Não', b.rel ? 'Sim' : 'Não']]);
  return {};
}

function proximaLinhaLivre(reg) {
  const ultima = Math.max(reg.getLastRow(), PRIMEIRA_LINHA_REGISTRO);
  const nomes = reg.getRange(PRIMEIRA_LINHA_REGISTRO, 2, ultima - PRIMEIRA_LINHA_REGISTRO + 2, 1).getValues();
  for (let i = 0; i < nomes.length; i++) if (!String(nomes[i][0]).trim()) return PRIMEIRA_LINHA_REGISTRO + i;
  return ultima + 1;
}

function gravarPessoa(b) {
  const reg = aba(ABA_REGISTRO);
  const p = b.pessoa || {};
  let linha = Number(b.linha) || 0;
  if (linha < PRIMEIRA_LINHA_REGISTRO) linha = proximaLinhaLivre(reg);
  reg.getRange(linha, 1, 1, 12).setValues([[
    paraData(p.data1), p.nome || '', p.contato || '', p.gatilho || '', paraData(p.dataAtiv), p.respondeu || '',
    paraData(p.dataResp), p.etapa || '', p.followup || '', paraData(p.callData), p.motivo || '', p.obs || ''
  ]]);
  return { linha: linha };
}

function apagarPessoa(b) {
  const linha = Number(b.linha) || 0;
  if (linha < PRIMEIRA_LINHA_REGISTRO) throw new Error('linha_invalida');
  aba(ABA_REGISTRO).getRange(linha, 1, 1, 12).clearContent();
  return {};
}
