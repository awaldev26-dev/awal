/**
 * Emoji par entrée, désigné par son codepoint Unicode.
 *
 * L'unicité compte autant que la justesse : le jeu « écoute et choisis » présente
 * quatre images côte à côte, et deux emojis identiques rendent la question insoluble.
 * Un test vérifie qu'aucun emoji n'est employé deux fois.
 */
export const PICTOS: Record<string, string> = {
  // ── La famille ──
  baba: '1F468', yemma: '1F469', setti: '1F475', jeddi: '1F474',
  gma: '1F46C', oultma: '1F46D', mmi: '1F476', yelli: '1F9D2',
  aqchich: '1F466', thaqchichth: '1F467', argaz: '1F9D4', thamettouth: '1F483',
  arrach: '1F465', thawachoulth: '1F46A', khali: '1F9D3', '3ammi': '1F574',
  khalti: '1F64B', '3ammti': '1F646', amghar: '1F9D9',

  // ── Le corps ──
  aqerrouy: '1F464', thit: '1F441', amezzough: '1F442', thinzerth: '1F443',
  imi: '1F444', iles: '1F445', thoughmesth: '1F9B7', afous: '270B',
  adhar: '1F9B6', ighil: '1F4AA', adhadh: '1F446', oul: '2764',
  a3bboudh: '1F930', achebboub: '1F487', azagour: '1F519', oudhem: '1F600',
  ighes: '1F9B4', idammen: '1FA78',

  // ── Les animaux ──
  amchich: '1F431', aydi: '1F436', thafounasth: '1F404', afounas: '1F402',
  a3oudiw: '1F434', aghyoul: '1FACF', aserdoun: '1F40E', ikerri: '1F411',
  thaghath: '1F410', afroukh: '1F426', ayazidh: '1F413', thayazith: '1F414',
  izem: '1F981', ouchchen: '1F43A', ifis: '1F406', agherda: '1F42D',
  azrem: '1F40D', thizizwith: '1F41D', thasekkourth: '1F54A', ilef: '1F417',

  // ── Manger et boire ──
  aghroum: '1F35E', aman: '1F4A7', ayefki: '1F95B', lben: '1F376',
  oudhi: '1F9C8', thamemth: '1F36F', zzith: '1F9F4', aksoum: '1F969',
  seksou: '1F372', lmelh: '1F9C2', sskkar: '1F36C', latay: '1F375',
  lqahwa: '2615', thamellalt: '1F95A', lekhrif: '1F348', azemmour: '1FAD2',
  adhil: '1F347', ttefah: '1F34E', thakhsayth: '1F383', ibawen: '1FAD8',
  lbatata: '1F954', imekli: '1F37D', imensi: '1F35B',

  // ── Les couleurs ──
  amellal: '2B1C', aberkan: '2B1B', azeggagh: '1F7E5', awragh: '1F7E8',
  azegzaw: '1F7E9',

  // ── Les nombres ──
  yiwen: '0031-FE0F-20E3', sin: '0032-FE0F-20E3', tlata: '0033-FE0F-20E3',
  reb3a: '0034-FE0F-20E3', khemsa: '0035-FE0F-20E3', setta: '0036-FE0F-20E3',
  seb3a: '0037-FE0F-20E3', tmenya: '0038-FE0F-20E3', tes3a: '0039-FE0F-20E3',
  '3echra': '1F51F',

  // ── La maison ──
  akham: '1F3E0', thaddarth: '1F3D8', thawourth: '1F6AA', oussou: '1F6CF',
  lkoursi: '1FA91', thabla: '1F6CB', lemri: '1FA9E', thasarouth: '1F511',
  lmous: '1F52A', thaqessoulth: '1F958',

  // ── Dehors et le temps ──
  adhrar: '26F0', azrou: '1FAA8', akal: '1F7EB', thamourth: '1F30D',
  asif: '1F3DE', lebhar: '1F30A', ttejra: '1F333', ifer: '1F343',
  nnewwar: '1F338', thafoukth: '2600', ayyour: '1F319', ithri: '2B50',
  igenni: '1F324', anzar: '1F327', adfel: '2744', adhou: '1F4A8',
  thimes: '1F525', ass: '1F31E', idh: '1F31A', assa: '1F4C5',
  azekka: '23ED', idhelli: '23EE', thafsouth: '1F337', anebdou: '1F3D6',
  'lekhrif-2': '1F342', chetwa: '26C4',

  // ── Les vêtements ──
  abernous: '1F9E5', aqendour: '1F457', thamehremth: '1F9E3', irkasen: '1F45F',
  thachachith: '1F9E2', aserwal: '1F456', thqamijth: '1F455',

  // ── Les verbes ──
  eqqim: '1F4BA', kker: '1F9CD', 'as-ed': '1F917', ddou: '1F6B6',
  azzel: '1F3C3', ali: '2B06', ers: '2B07', kchem: '1F4E5',
  ffegh: '1F4E4', oughal: '1F504', hbes: '1F6D1', bedd: '1F482',
  etch: '1F374', sew: '1F964', ttes: '1F634', ekker: '23F0',
  ssired: '1F9FC', sfedh: '1F9FD', els: '1F454',
  sel: '1F3A7', mouqel: '1F440', zer: '1F50D', ini: '1F4AC',
  ssiwel: '1F4E2', ssousem: '1F92B', steqsi: '2753', err: '21A9',
  gher: '1F4D6', arou: '270D', hseb: '1F522',
  eg: '1F6E0', khdem: '1F477', efk: '1F381', eddem: '1F932',
  awi: '1F4E6', ldi: '1F513', sekker: '1F512', ssers: '1F4CD',
  nadi: '1F50E', af: '2705', gzem: '2702', '3wen': '1F91D', ejj: '1F64C',
  ourar: '1F3AE', dhes: '1F602', rou: '1F622', hemmel: '1F970',
  fehm: '1F4A1', ssen: '1F9E0', echfou: '1F4AD', ttou: '1F32B',
  agad: '1F628', hader: '26A0', yezzi: '1F645',

  // ── Politesse et mots-outils ──
  azul: '1F44B', 'sbah-lkhir': '1F305', marhba: '1F389', thanemmirth: '1F64F',
  bslama: '1F91A', 'ar-toufath': '1F304', 'amek-thellidh': '1F914', labas: '1F44D',
  ih: '2714', ouhou: '274C', 'ma-oulach-aghilif': '1F97A', semmhiyi: '1F614',
  yerbeh: '1F44F', '3yya': '1F3C1', 'd-achou-t': '2754', anwa: '1F9D0',
  anda: '1F5FA', melmi: '1F550', amek: '1F500', achimi: '1F9E9', achhal: '1F4CA',
}

/** Repli pour toute entrée absente de la table ci-dessus. */
export const PICTO_PAR_THEME: Record<string, string> = {
  'la-famille': '1F46B',
  'le-corps': '1F9CD',
  'les-animaux': '1F43E',
  'manger-et-boire': '1F37D',
  'les-couleurs': '1F3A8',
  'les-nombres': '1F522',
  'la-maison': '1F3E0',
  'dehors-et-le-temps': '1F30D',
  'les-vetements': '1F455',
  'les-verbes': '1F3C3',
  'politesse-et-mots-outils': '1F4AC',
}

export const COULEUR_PAR_THEME: Record<string, string> = {
  'la-famille': '#c94f7c',
  'le-corps': '#c97a4f',
  'les-animaux': '#3d7ec9',
  'manger-et-boire': '#c94f3d',
  'les-couleurs': '#8e4fc9',
  'les-nombres': '#4f8ec9',
  'la-maison': '#8a6d3b',
  'dehors-et-le-temps': '#2e8b57',
  'les-vetements': '#b8860b',
  'les-verbes': '#c9564f',
  'politesse-et-mots-outils': '#4f6dc9',
}

export function pictoPour(id: string, theme: string): string {
  return `openmoji:${PICTOS[id] ?? PICTO_PAR_THEME[theme] ?? '2753'}`
}
