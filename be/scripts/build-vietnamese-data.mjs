import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createReadStream, readFileSync, writeFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { parse } from 'csv-parse/sync'
import { grammarLabels, grammarTerms, partsOfSpeech } from './vietnamese-labels.mjs'

const root = new URL('../', import.meta.url)
const file = name => fileURLToPath(new URL(name, root))
const dictionaryFile = file('.cache/data/bunchaway.csv')
const dictionarySha256 = '8b25e5e841c47c61bd77c8c6dc959ac325330a484500387677cec04a34d2377c'
const corpusFile = file('.cache/data/openjlpt.sqlite')
const modelDirectory = '.cache/translate/envit5'
const modelFiles = {
  'config.json': 'f1859dad6c46f6b301b97634821e6f6f8928b6323293072e759ca68946dbf601',
  'model.bin': 'e8a3d9be0fc077668972ed89c351cc4c911a09e9e3c6d8966478c113fc85ff8e',
  'shared_vocabulary.json': '89afe9585b3730300157f6039647dfb9bd5e69063f90b6072e59ddfd95fafa0d',
  'spiece.model': '3b4eda923bbac1726e8fda66254a8783ecc705be5577149ee8c98074efdb5de5'
}
const translationInput = file('.cache/translate/inputs.json')
const translationOutput = file('.cache/translate/translations.json')
const array = value => JSON.parse(value || '[]')
const exact = value => String(value ?? '').normalize('NFC').trim()
const meaning = value => exact(value).replace(/^\d+[.)]\s+/, '').replace(/\s+/g, ' ')
const clean = value => exact(value).replace(/\s+([.,;!?])/g, '$1')
const unique = items => [...new Set(items.filter(Boolean))]

async function verify(path, expected) {
  const digest = createHash('sha256')
  for await (const chunk of createReadStream(path)) digest.update(chunk)
  if (digest.digest('hex') !== expected) throw new Error('Checksum không khớp: ' + path)
}

const dictionaryBytes = readFileSync(dictionaryFile)
if (createHash('sha256').update(dictionaryBytes).digest('hex') !== dictionarySha256) {
  throw new Error('Checksum từ điển Bunchaway không khớp.')
}
const dictionary = new Map(parse(dictionaryBytes, { bom: true }).map(([word, senses]) => [exact(word), unique(senses.split('\n').map(meaning))]))
await verify(corpusFile, '5263ba7a5000a9013baa646b3b80241161028fc561c092d57dc8b864ae92b271')
const corpus = new DatabaseSync(corpusFile, { readOnly: true })
const kanji = corpus.prepare('SELECT * FROM kanji ORDER BY rowid').all()
const words = corpus.prepare('SELECT * FROM vocab ORDER BY rowid').all()
const grammar = corpus.prepare('SELECT * FROM grammar ORDER BY rowid').all()
corpus.close()

const handEdited = {
  'open-v-65783b95dd': ['Học, học tập; việc học', 'Sự cố gắng, nỗ lực', 'Giảm giá, bớt giá (trong mua bán)'],
  'open-k-52c9': ['Cố gắng, gắng sức', 'Chăm chỉ, siêng năng'],
  'open-k-5f37': ['Mạnh, khỏe', 'Cường độ cao', 'Ép buộc'],
  'open-k-65e5': ['Mặt trời', 'Ngày, ban ngày']
}
const exampleEdits = {
  'How many hours have you been studying?': 'Bạn đã học được bao nhiêu tiếng rồi?',
  'Why do you study every day?': 'Tại sao bạn học mỗi ngày?',
  '"The Nightingale Samurai" is a samurai tale full of humanity and humour.': '“Võ sĩ chim họa mi” là một câu chuyện về samurai đầy tình người và hài hước.',
  'Behold, the Lamb of God, who takes away the sins of the world!': 'Kìa, Chiên Con của Thiên Chúa, Đấng xóa bỏ tội lỗi của thế gian!',
  'Hatred is the other side of cuteness.': 'Sự căm ghét là mặt trái của vẻ đáng yêu.'
}
const translationEdits = {
  '-ish; -like; tends to (casual)': 'Hơi giống, có vẻ như, thường có xu hướng (cách nói thân mật)',
  'smack of; seem like (in a bad way); -ish': 'Có vẻ, mang dáng dấp của điều gì đó, thường theo nghĩa tiêu cực',
  'as (it was); while remaining; since (birth)': 'Giữ nguyên như lúc trước, trong khi vẫn ở trạng thái đó, từ khi sinh ra',
  'if only (..., but); although (regret or reproach)': 'Giá mà… (diễn tả sự tiếc nuối hoặc trách móc)',
  'must not; do not (on signs); (before a noun) must not be': 'Không được, nghiêm cấm (trên biển báo hoặc trước danh từ chỉ điều bị cấm)',
  'Meaning: Ms.': 'Cô, bà (cách xưng hô lịch sự)',
  'Meaning: OK.': 'Được, ổn, đồng ý'
}
const grammarEdits = {
  wa: { summary: 'Nêu chủ đề của câu hoặc chuyển sang điều đang được nói đến.' },
  'ga-subject': {
    summary: 'Đánh dấu chủ ngữ, nhấn mạnh thông tin mới hoặc chủ ngữ cần xác định.',
    notes: 'Dùng が sau từ để hỏi như だれ và 何 khi chúng làm chủ ngữ. Với 好き, ほしい, 上手 và わかる, が có thể đánh dấu đối tượng được thích, mong muốn, làm tốt hoặc hiểu.'
  },
  o: { summary: 'Đánh dấu tân ngữ trực tiếp, nơi đi qua hoặc nơi rời khỏi.' },
  'ni-location': { summary: 'Ở, tại (chỉ nơi người hoặc vật đang hiện diện).' },
  'ni-frequency': { summary: 'Mỗi, trong (số lần trong một khoảng thời gian).' },
  'de-means': { summary: 'Bằng (chỉ phương tiện, công cụ, phương pháp hoặc ngôn ngữ).' },
  'to-and': { summary: 'Và (nối các danh từ trong một danh sách được liệt kê đầy đủ).' },
  mo: { summary: 'Cũng, cả. Trong câu phủ định, có thể diễn tả “cũng không” hoặc “không… nào”.' },
  'ka-question': {
    summary: 'Trợ từ cuối câu đánh dấu câu hỏi.',
    notes: 'Câu hỏi lịch sự kết thúc bằng か và thường viết với dấu 。. Trong lời nói thân mật, người nói thường lược か và lên giọng ở cuối câu.'
  },
  desu: { summary: 'Hệ từ lịch sự, có thể dịch là “là” tùy ngữ cảnh.' },
  da: { summary: 'Hệ từ ở thể thông thường, có thể dịch là “là” tùy ngữ cảnh.' },
  'de-gozaimasu': { summary: 'Hệ từ rất lịch sự, dùng trong bối cảnh trang trọng hoặc khi phục vụ khách.' },
  'koto-instruction': { summary: 'Phải, hãy (dùng trong nội quy và chỉ dẫn viết).' },
  nagara: { summary: 'Vừa… vừa… (hai hành động diễn ra cùng lúc).' },
  'nai-to-ikenai-nakucha': { summary: 'Phải làm gì đó (cách nói thân mật).' },
  'ni-tsurete': { summary: 'Cùng với sự thay đổi của một việc, một việc khác cũng thay đổi theo.' },
  'o-kagiri-ni': { summary: 'Kể từ mốc đó thì dừng. Với 声, diễn tả việc cất tiếng hết mức có thể.' },
  'masen-ka': { notes: 'Mềm hơn 〜ましょう vì người nghe có thể từ chối dễ hơn. Có thể nhận lời bằng ええ、〜ましょう.' },
  'te-mo-ii': { notes: 'Thêm ですか để xin phép. Có thể từ chối lịch sự bằng すみません、ちょっと…' },
  'te-iru': { summary: 'Diễn tả hành động đang diễn ra, trạng thái còn lại sau một thay đổi hoặc hành động lặp lại thường xuyên.' },
  te: { notes: 'Động từ cuối quyết định thì của cả câu. Ví dụ 書く → 書いて, 飲む → 飲んで, 話す → 話して, 買う → 買って, 行く → 行って (ngoại lệ).' },
  'te-morau': { summary: 'Được ai đó làm giúp một việc, hoặc nhờ người khác làm một việc cho mình.' },
  'te-iku': { notes: 'Chỉ sự di chuyển ra xa người nói hoặc sự thay đổi tiếp diễn từ hiện tại về sau. So sánh với 〜てくる.' },
  sugiru: { notes: 'Chia như động từ nhóm 2, chẳng hạn すぎた và すぎて. Lưu ý いい → よすぎる và ない → なさすぎる.' },
  'you-to-omou': { summary: 'Định làm gì đó, đang nghĩ đến việc sẽ làm một việc.' },
  shi: { notes: 'Liệt kê nhiều lý do hoặc đặc điểm. Dùng một lần し cũng có thể ngụ ý còn những lý do khác.' },
  'kedo-keredomo': { notes: 'Cách nói thiên về hội thoại hơn が. けれども trang trọng hơn けど. Có thể dùng để mở lời trước một câu hỏi hay lời nhờ.' },
  'to-iu-say': { notes: 'Đặt lời trích dẫn trực tiếp trong 「」. Dùng thể thông thường khi dẫn gián tiếp. Khi kể lại lời người khác, thường dùng 〜と言っていた.' },
  'sasete-kudasai': { notes: 'Dùng thể て của dạng sai khiến, chẳng hạn する → させて. Cách nói 〜させていただけませんか lịch sự hơn.' },
  'o-ni-naru': { notes: 'Các động từ có gốc một âm tiết như 見る, 寝る hoặc có dạng tôn kính riêng như 行く → いらっしゃる cần dùng mẫu khác. Với danh từ kết hợp する, dùng ご + danh từ + になる, ví dụ ご利用になる.' },
  'koto-ni-shite-iru': { summary: 'Tự đặt ra quy tắc cho mình và duy trì thực hiện như một thói quen.' },
  'zu-ni': { notes: 'Tương đương 〜ないで trong văn viết hoặc cách nói trang trọng. Các dạng bất quy tắc gồm する → せずに và 来る → 来ずに (こずに).' },
  'okage-de': { notes: 'Nêu nguyên nhân dẫn đến kết quả tốt và thể hiện sự biết ơn. Đôi khi dùng với ý mỉa mai khi có kết quả xấu, như 君のおかげで遅刻したよ. So sánh với 〜せいで.' },
  'o-kikkake-ni': { summary: 'Nhân dịp, bắt đầu từ một sự kiện hoặc lấy sự kiện đó làm động lực cho việc khác.' },
  'kara-suru-to-kara-sureba': { summary: 'Xét theo, nhìn từ lập trường hoặc thông tin đã nêu.' },
  'kara-iu-to-kara-itte': {
    summary: 'Xét về, nhìn từ góc độ, căn cứ vào.',
    notes: 'Thường theo sau tiêu chí hoặc góc nhìn như 立場, 経験 và 値段. Khi lấy một người làm điểm nhìn, có thể dùng 親からすると. Biến thể khác là 〜からいえば.'
  },
  gatai: { notes: 'Dùng với động từ chỉ suy nghĩ hoặc cảm xúc như 信じる, 理解する và 許す. Khi nói về trở ngại về mặt thể chất, mẫu 〜にくい phù hợp hơn.' },
  'ni-kagitte': { summary: 'Riêng vào đúng lúc ấy, riêng người ấy, thường đi với một kết quả bất ngờ hoặc trái dự đoán.' },
  'ni-kakawaru': { summary: 'Liên quan trực tiếp đến hoặc ảnh hưởng đến vấn đề quan trọng.' },
  'yara-yara': { notes: 'Liệt kê vài ví dụ trong một tình huống có nhiều sự việc, thường gợi sự lộn xộn hoặc cảm xúc đan xen. Có thể nối bằng で rồi dùng 大変だ hoặc 忙しい.' },
  'o-yogi-naku-sareru': { summary: 'Bị buộc phải làm, không còn lựa chọn nào khác.' },
  'o-ki-ni': { summary: 'Nhân dịp, lấy một sự kiện làm mốc hoặc bước ngoặt.' },
  'o-mono-tomo-sezu': { notes: 'Dùng để bày tỏ sự khâm phục khi người khác coi nhẹ trở ngại và vượt qua. So sánh với 〜をよそに, thường hàm ý phê bình vì phớt lờ điều người khác quan tâm.' },
  'o-yoso-ni': { summary: 'Phớt lờ, để ngoài tai, không để tâm đến sự việc hay mối lo của người khác.' },
  ge: { notes: 'Diễn tả cảm xúc có thể nhận ra qua nét mặt hoặc cách cư xử của người khác. Mẫu 〜げ chia như tính từ đuôi な, chẳng hạn 〜げな và 〜げに.' },
  'goto-ni': { notes: 'Chỉ sự lặp lại đều đặn hoặc lần lượt theo từng đơn vị. Khi đứng sau động từ thể từ điển, gần nghĩa với 〜たびに. 一日ごとに là mỗi ngày, còn 一日おきに là cách một ngày.' },
  'ippou-da': { summary: 'Càng lúc càng…, cứ tiếp tục thay đổi theo một hướng.' },
  katagata: { notes: 'Mẫu trang trọng, thường đi với お礼, ご挨拶, ご報告, お見舞い và động từ chỉ việc ghé thăm như 伺う hoặc 訪ねる. So sánh với 〜がてら trong hội thoại và 〜かたわら cho các hoạt động song song lâu dài.' },
  'made-da-made-no-koto-da': { notes: 'Sau động từ thể từ điển, diễn tả quyết tâm dùng phương án còn lại. Sau động từ thể た, có nghĩa “tôi chỉ làm vậy thôi”, thường để giải thích hành động của mình.' },
  masu: { summary: 'Đuôi động từ lịch sự ở thể phi quá khứ, dùng cho hiện tại hoặc tương lai.' },
  'nai-koto-wa-nai': { notes: 'Phủ định kép, diễn tả sự thừa nhận có dè dặt. Cũng có dạng 〜ないこともない. Mẫu động từ thể từ điển + ことはない diễn tả “không cần làm”.' },
  'ni-kakawarazu': { notes: 'Đi với danh từ chỉ phạm vi hoặc cặp đối lập, như 年齢, 天候, 有無 và 男女. Gần nghĩa với 〜を問わず. Mẫu 〜にもかかわらず diễn tả “mặc dù”.' },
  'ni-shitagatte': { notes: 'Sau danh từ chỉ quy tắc hoặc hướng dẫn, nghĩa là “theo, tuân theo”. Sau động từ thể từ điển, diễn tả sự thay đổi kéo theo như 〜につれて, với sắc thái trang trọng hơn.' },
  'ue-de': { notes: 'Động từ thể た + 上で diễn tả làm A trước rồi làm B dựa trên đó. Động từ thể từ điển + 上で nghĩa là “trong quá trình A” hoặc “để A”. Trong văn bản công việc, có thể gặp dạng ご確認の上.' },
  'gotoki-gotoku': { summary: 'Như, tựa như. Khi nói về một người, đôi khi hàm ý xem nhẹ người đó.' }
}
const readingsByWord = new Map()
for (const row of words) {
  if (!readingsByWord.has(row.word)) readingsByWord.set(row.word, new Set())
  readingsByWord.get(row.word).add(row.reading)
}
function sourceSenses(row) {
  // A surface-form dictionary does not distinguish homographs with different readings.
  if (readingsByWord.get(row.word).size > 1) return []
  for (const form of unique([row.word, ...array(row.other_forms)])) {
    const senses = dictionary.get(exact(form))
    if (senses?.length) return senses
  }
  return []
}

const tasks = new Set()
const enqueue = value => { if (exact(value)) tasks.add(exact(value)) }
const gloss = value => 'Meaning: ' + meaning(value).replace(/[.!?]+$/, '') + '.'
function protectJapanese(value) {
  const japanese = []
  const input = exact(value).replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〇ー〜～]+/gu, term => {
    japanese.push(term)
    return '(JP' + japanese.length + ')'
  })
  return { input, japanese }
}
for (const row of kanji) for (const value of array(row.meanings)) enqueue(gloss(value))
for (const row of words) {
  if (!sourceSenses(row).length) for (const value of array(row.meanings)) enqueue(gloss(value))
}
const descriptors = /[（(]([a-z][a-z /-]*)[）)]/gi
for (const row of grammar) {
  enqueue(protectJapanese(row.meaning).input)
  enqueue(protectJapanese(row.notes).input)
  for (const [, descriptor] of row.pattern.matchAll(descriptors)) if (!grammarLabels[descriptor.toLowerCase()]) enqueue(gloss(descriptor))
}
for (const row of [...words, ...grammar]) for (const item of array(row.examples)) enqueue(protectJapanese(item.en).input)

if (process.argv.includes('--translate')) {
  await Promise.all(Object.entries(modelFiles).map(([name, checksum]) => verify(file(modelDirectory + '/' + name), checksum)))
  writeFileSync(translationInput, JSON.stringify([...tasks]))
  execFileSync(process.env.NIHONGO_PYTHON || 'python', [
    file('scripts/translate-vietnamese.py'), file(modelDirectory), translationInput, translationOutput
  ], { stdio: 'inherit' })
}

const translated = JSON.parse(readFileSync(translationOutput, 'utf8'))
function translation(value) {
  const key = exact(value)
  if (!key) return ''
  const result = clean(translationEdits[key] || translated[key])
  if (!result) throw new Error('Thiếu bản dịch cho: ' + key)
  return result
}
function translatedText(value) {
  const { input, japanese } = protectJapanese(value)
  const result = translation(input).replace(/(?:\(\s*)?\bJ\s*P\s*0*(\d+)\b(?:\s*\))?/gi, (_, ordinal) => japanese[Number(ordinal) - 1] || '')
  const missing = unique(japanese).filter(term => !result.includes(term))
  return missing.length ? result + ' (Biểu thức gốc: ' + missing.join('、') + ')' : result
}
function glosses(values) {
  return unique(values.map(value => translation(gloss(value))
    .replace(/^(?:ý )?nghĩa\s*[:：]\s*|^(?:có )?nghĩa (?:là|của từ)\s*[:：]?\s*/i, '')
    .replace(/^\s*để\s+/i, '').replace(/[.。]$/, '')))
}
function localizeFormula(text) {
  const terms = Object.keys(grammarTerms).sort((a, b) => b.length - a.length)
  return exact(text).replace(new RegExp('(?<![a-z-])(' + terms.join('|') + ')(?![a-z-])', 'gi'), value => grammarTerms[value.toLowerCase()])
}
const entries = {}
for (const row of kanji) {
  const id = 'open-k-' + row.character.codePointAt(0).toString(16)
  const fromSource = !array(row.meanings).length && dictionary.get(row.character)
  const meanings = handEdited[id] || fromSource || glosses(array(row.meanings))
  entries[id] = { meanings, translationStatus: handEdited[id] ? 'REVIEWED' : fromSource ? 'SOURCE' : 'MACHINE' }
}
for (const row of words) {
  const id = 'open-v-' + row.id
  const senses = sourceSenses(row)
  const meanings = handEdited[id] || (senses.length ? senses : glosses(array(row.meanings)))
  const tags = unique(array(row.pos).map(code => partsOfSpeech[code]))
  entries[id] = { meanings, tags, translationStatus: handEdited[id] ? 'REVIEWED' : senses.length ? 'SOURCE' : 'MACHINE' }
}
for (const row of grammar) {
  const title = row.pattern.replace(descriptors, (_, value) => '（' + (grammarLabels[value.toLowerCase()] || glosses([value])[0]) + '）')
  entries['open-g-' + row.id] = {
    title, summary: translatedText(row.meaning), notes: translatedText(row.notes), formula: localizeFormula(row.formation),
    romaji: exact(row.romaji).replace(/\s*\([^)]*\)$/, ''),
    tags: unique(array(row.tags).map(tag => grammarLabels[tag])), translationStatus: 'MACHINE', ...grammarEdits[row.id]
  }
}
const examples = {}
for (const row of [...words, ...grammar]) for (const item of array(row.examples)) {
  if (exact(item.en)) examples[exact(item.en)] = exampleEdits[exact(item.en)] || translatedText(item.en)
}
const ordered = value => Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))
const output = file('data/vietnamese-dictionary.json')
const jsonLines = value => Object.entries(ordered(value)).map(([key, item]) => JSON.stringify(key) + ':' + JSON.stringify(item)).join(',\n')
writeFileSync(output, '{"entries": {\n' + jsonLines(entries) + '\n}, "examples": {\n' + jsonLines(examples) + '\n}}\n')
console.log({ entries: Object.keys(entries).length, examples: Object.keys(examples).length, modelInputs: tasks.size })
