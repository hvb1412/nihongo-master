export const curriculum = [
  {
    level: 'N5', topic: 'Trường học',
    kanji: [
      ['日', 'NHẬT', ['ニチ', 'ジツ'], ['ひ', 'か'], 'ngày, mặt trời', '日', 4],
      ['学', 'HỌC', ['ガク'], ['まな.ぶ'], 'học, việc học', '子', 8],
      ['生', 'SINH', ['セイ', 'ショウ'], ['い.きる', 'う.まれる'], 'sống, sinh ra', '生', 5]
    ],
    vocabulary: [
      ['学生', 'がくせい', 'học sinh, sinh viên', 'Danh từ', '私は学生です。', '{私|わたし}は{学生|がくせい}です。', 'Tôi là học sinh.'],
      ['学校', 'がっこう', 'trường học', 'Danh từ', '学校へ行きます。', '{学校|がっこう}へ{行|い}きます。', 'Tôi đi đến trường.'],
      ['食べる', 'たべる', 'ăn', 'Động từ', '毎朝パンを食べます。', '{毎朝|まいあさ}パンを{食|た}べます。', 'Tôi ăn bánh mì mỗi sáng.', { formGroup: 'Nhóm II (ichidan)', transitivity: 'Tha động từ', conjugations: { 'Lịch sự': '食べます', 'Phủ định': '食べない', 'Quá khứ': '食べた', 'Thể て': '食べて', 'Khả năng': '食べられる' } }]
    ],
    grammar: [
      ['〜は', 'trợ từ đánh dấu chủ đề', 'Danh từ + は + thông tin', 'Trong vai trò trợ từ, は đọc là わ. Phần sau nêu điều người nói muốn nói về chủ đề.', '田中さんは先生です。', '{田中|たなか}さんは{先生|せんせい}です。', 'Cô Tanaka là giáo viên.'],
      ['〜です', 'là, cách kết thúc câu lịch sự', 'Danh từ + です', 'です giúp câu giới thiệu danh tính và nghề nghiệp có sắc thái lịch sự.', '私は学生です。', '{私|わたし}は{学生|がくせい}です。', 'Tôi là học sinh.'],
      ['〜を', 'đánh dấu tân ngữ trực tiếp', 'Danh từ + を + tha động từ', 'を đọc là お khi làm trợ từ. Với 食べる, danh từ đứng trước を là thứ được ăn.', '朝ご飯を食べます。', '{朝|あさ}ご{飯|はん}を{食|た}べます。', 'Tôi ăn sáng.']
    ],
    reading: ['Một ngày ở trường', '私は学生です。毎朝七時に起きます。朝ご飯を食べて、八時に学校へ行きます。学校で日本語を勉強します。', '{私|わたし}は{学生|がくせい}です。{毎朝|まいあさ}{七時|しちじ}に{起|お}きます。{朝|あさ}ご{飯|はん}を{食|た}べて、{八時|はちじ}に{学校|がっこう}へ{行|い}きます。{学校|がっこう}で{日本語|にほんご}を{勉強|べんきょう}します。', 'Tôi là học sinh. Mỗi sáng tôi thức dậy lúc bảy giờ. Tôi ăn sáng rồi đến trường lúc tám giờ. Ở trường tôi học tiếng Nhật.'],
    listening: ['Hẹn ở nhà ga', '明日、九時に駅で会いましょう。駅の前に小さい店があります。その店の前で待っています。', 'Ngày mai gặp nhau ở nhà ga lúc chín giờ nhé. Trước ga có một cửa hàng nhỏ. Tôi sẽ đợi trước cửa hàng đó.']
  },
  {
    level: 'N4', topic: 'Đời sống',
    kanji: [
      ['旅', 'LỮ', ['リョ'], ['たび'], 'chuyến đi, du lịch', '方', 10],
      ['料', 'LIỆU', ['リョウ'], [], 'nguyên liệu, phí', '斗', 10],
      ['理', 'LÝ', ['リ'], ['ことわり'], 'lý lẽ, sắp xếp', '王', 11]
    ],
    vocabulary: [
      ['旅行', 'りょこう', 'du lịch, chuyến đi', 'Danh từ · する', '夏に旅行をしました。', '{夏|なつ}に{旅行|りょこう}をしました。', 'Tôi đã đi du lịch vào mùa hè.'],
      ['料理', 'りょうり', 'món ăn, việc nấu ăn', 'Danh từ · する', '母は料理が上手です。', '{母|はは}は{料理|りょうり}が{上手|じょうず}です。', 'Mẹ tôi nấu ăn giỏi.'],
      ['用意', 'ようい', 'chuẩn bị', 'Danh từ · する', '会議の資料を用意します。', '{会議|かいぎ}の{資料|しりょう}を{用意|ようい}します。', 'Tôi sẽ chuẩn bị tài liệu cho cuộc họp.']
    ],
    grammar: [
      ['〜たことがある', 'đã từng làm gì', 'Động từ thể た + ことがある', 'Diễn tả kinh nghiệm đã có. Dùng ことがない khi muốn nói chưa từng.', '京都へ行ったことがあります。', '{京都|きょうと}へ{行|い}ったことがあります。', 'Tôi đã từng đến Kyoto.'],
      ['〜てみる', 'thử làm gì', 'Động từ thể て + みる', 'Dùng khi thử thực hiện một việc để biết kết quả hoặc cảm nhận.', 'この料理を作ってみます。', 'この{料理|りょうり}を{作|つく}ってみます。', 'Tôi sẽ thử nấu món này.'],
      ['〜ながら', 'vừa làm việc này vừa làm việc kia', 'Bỏ ます + ながら', 'Hai hành động diễn ra cùng lúc, thường cùng chủ thể. Hành động chính ở cuối câu.', '音楽を聞きながら料理します。', '{音楽|おんがく}を{聞|き}きながら{料理|りょうり}します。', 'Tôi vừa nghe nhạc vừa nấu ăn.']
    ],
    reading: ['Chuyến đi bị hoãn', '日曜日に友達と海へ行く予定でした。でも、朝から雨が降っていたので、旅行は来週にしました。日曜日は家で一緒に料理を作りました。', '', 'Chủ nhật tôi định đi biển cùng bạn nhưng trời mưa từ sáng nên dời chuyến đi sang tuần sau. Hôm đó chúng tôi nấu ăn cùng nhau ở nhà.'],
    listening: ['Đổi giờ gặp', '今日の約束ですが、仕事が長くなりそうです。六時には間に合いません。七時半に変更してもいいですか。場所は前と同じです。', 'Về cuộc hẹn hôm nay, công việc có vẻ sẽ kéo dài. Tôi sẽ không kịp lúc sáu giờ. Đổi sang bảy giờ rưỡi được không? Địa điểm vẫn như cũ.']
  },
  {
    level: 'N3', topic: 'Công việc',
    kanji: [
      ['決', 'QUYẾT', ['ケツ'], ['き.める', 'き.まる'], 'quyết định', '氵', 7],
      ['続', 'TỤC', ['ゾク'], ['つづ.く', 'つづ.ける'], 'tiếp tục, nối tiếp', '糸', 13],
      ['議', 'NGHỊ', ['ギ'], [], 'bàn bạc, nghị luận', '言', 20]
    ],
    vocabulary: [
      ['決定', 'けってい', 'quyết định, sự ấn định', 'Danh từ · する', '開催日が決定しました。', '{開催日|かいさいび}が{決定|けってい}しました。', 'Ngày tổ chức đã được ấn định.'],
      ['継続', 'けいぞく', 'sự tiếp tục, duy trì', 'Danh từ · する', '継続には小さな目標が役立つ。', '{継続|けいぞく}には{小|ちい}さな{目標|もくひょう}が{役立|やくだ}つ。', 'Mục tiêu nhỏ giúp duy trì việc đang làm.'],
      ['会議', 'かいぎ', 'cuộc họp', 'Danh từ', '明日の会議はオンラインです。', '{明日|あした}の{会議|かいぎ}はオンラインです。', 'Cuộc họp ngày mai diễn ra trực tuyến.']
    ],
    grammar: [
      ['〜ようにする', 'cố gắng duy trì một việc', 'Động từ thể từ điển hoặc thể ない + ようにする', 'Diễn tả việc chủ động cố gắng tạo hoặc giữ một thói quen.', '毎日少しでも読むようにしています。', '{毎日|まいにち}{少|すこ}しでも{読|よ}むようにしています。', 'Tôi cố gắng đọc mỗi ngày dù chỉ một chút.'],
      ['〜ために', 'để, nhằm mục đích', 'Động từ thể từ điển + ために / Danh từ + の + ために', 'Dùng cho mục tiêu có chủ ý. Với động từ ở hai vế, chủ thể thường giống nhau.', '試験に合格するために勉強する。', '{試験|しけん}に{合格|ごうかく}するために{勉強|べんきょう}する。', 'Tôi học để thi đỗ.'],
      ['〜わけではない', 'không hẳn là', 'Mệnh đề thể thông thường + わけではない', 'Phủ định một suy luận hoặc cách khái quát, thường chỉ phủ định một phần.', '忙しいが、休めないわけではない。', '{忙|いそが}しいが、{休|やす}めないわけではない。', 'Tôi bận nhưng không hẳn là không thể nghỉ.']
    ],
    reading: ['Chọn giờ họp', '以前は全員が集まるまで会議が始まらず、予定が遅れることが多かった。そこで担当者は、前日までに議題を送り、開始時刻を守ることにした。欠席する人も事前に意見を提出できるようになった。', '', 'Trước đây các cuộc họp thường trễ vì đợi đủ người. Người phụ trách quyết định gửi nội dung trước một ngày và bắt đầu đúng giờ. Người vắng mặt cũng có thể gửi ý kiến trước.'],
    listening: ['Tài liệu trước cuộc họp', '午後の会議に向けて、資料を先に共有します。全部読む時間がない方は、最後のページにある提案だけ確認してください。質問は会議で受け付けます。', 'Tôi sẽ chia sẻ tài liệu trước cuộc họp chiều nay. Ai không có thời gian đọc hết thì hãy xem phần đề xuất ở trang cuối. Câu hỏi sẽ được tiếp nhận trong cuộc họp.']
  },
  {
    level: 'N2', topic: 'Xã hội',
    kanji: [
      ['環', 'HOÀN', ['カン'], ['わ'], 'vòng, môi trường', '王', 17],
      ['策', 'SÁCH', ['サク'], [], 'biện pháp, kế sách', '竹', 12],
      ['効', 'HIỆU', ['コウ'], ['き.く'], 'hiệu lực, có tác dụng', '力', 8]
    ],
    vocabulary: [
      ['環境', 'かんきょう', 'môi trường', 'Danh từ', '周囲の環境が変わった。', '{周囲|しゅうい}の{環境|かんきょう}が{変|か}わった。', 'Môi trường xung quanh đã thay đổi.'],
      ['対策', 'たいさく', 'biện pháp ứng phó', 'Danh từ', '暑さ対策を進めている。', '{暑|あつ}さ{対策|たいさく}を{進|すす}めている。', 'Các biện pháp chống nóng đang được triển khai.'],
      ['効果', 'こうか', 'hiệu quả, tác dụng', 'Danh từ', 'この方法の効果を調べる。', 'この{方法|ほうほう}の{効果|こうか}を{調|しら}べる。', 'Chúng tôi xem xét hiệu quả của phương pháp này.']
    ],
    grammar: [
      ['〜に伴って', 'cùng với sự thay đổi của', 'Danh từ / Động từ thể từ điển + に伴って', 'Hai thay đổi có quan hệ với nhau. Cách diễn đạt thường gặp trong văn viết và thông báo.', '人口の増加に伴って交通量が増えた。', '{人口|じんこう}の{増加|ぞうか}に{伴|ともな}って{交通量|こうつうりょう}が{増|ふ}えた。', 'Lưu lượng giao thông tăng cùng với sự gia tăng dân số.'],
      ['〜にかかわらず', 'bất kể, không phụ thuộc vào', 'Danh từ + にかかわらず', 'Cho biết một yếu tố sẽ không ảnh hưởng đến kết quả hoặc điều kiện được nêu.', '経験の有無にかかわらず応募できます。', '{経験|けいけん}の{有無|うむ}にかかわらず{応募|おうぼ}できます。', 'Bạn có thể ứng tuyển dù có kinh nghiệm hay chưa.'],
      ['〜に違いない', 'chắc hẳn là', 'Mệnh đề thể thông thường + に違いない', 'Thể hiện suy đoán có độ chắc chắn cao của người nói.', 'この足跡は犬のものに違いない。', 'この{足跡|あしあと}は{犬|いぬ}のものに{違|ちが}いない。', 'Dấu chân này chắc hẳn là của chó.']
    ],
    reading: ['Thử nghiệm giao thông xanh', '市は車の利用を減らすため、駅前に自転車の貸し出し場所を設けた。利用者は増えたものの、駅から遠い地域では効果が限られた。市は住宅地にも貸し出し場所を作り、その効果を比較する予定だ。', '', 'Thành phố đặt điểm mượn xe đạp trước ga để giảm dùng ô tô. Lượt sử dụng tăng nhưng hiệu quả ở xa ga còn hạn chế. Thành phố sẽ thêm điểm mượn tại khu dân cư để so sánh hiệu quả.'],
    listening: ['Điều chỉnh phương án', '試験運用では利用者の数は目標を上回りましたが、返却場所が足りないという声がありました。本格導入の前に、まず返却場所の配置を見直します。料金の変更は今のところ考えていません。', 'Số người dùng trong giai đoạn thử nghiệm vượt mục tiêu, nhưng có phản ánh thiếu chỗ trả. Trước khi triển khai chính thức, chúng tôi sẽ xem lại cách bố trí chỗ trả. Hiện chưa định đổi phí.']
  },
  {
    level: 'N1', topic: 'Phân tích',
    kanji: [
      ['顕', 'HIỂN', ['ケン'], ['あらわ.れる'], 'rõ rệt, hiển hiện', '頁', 18],
      ['譲', 'NHƯỢNG', ['ジョウ'], ['ゆず.る'], 'nhường, chuyển giao', '言', 20],
      ['慎', 'THẬN', ['シン'], ['つつし.む'], 'thận trọng, giữ gìn', '忄', 13]
    ],
    vocabulary: [
      ['顕著', 'けんちょ', 'rõ rệt, nổi bật', 'Tính từ な', '効果は若い世代で顕著だった。', '{効果|こうか}は{若|わか}い{世代|せだい}で{顕著|けんちょ}だった。', 'Hiệu quả thể hiện rõ rệt ở thế hệ trẻ.'],
      ['譲歩', 'じょうほ', 'nhượng bộ', 'Danh từ · する', '双方が少し譲歩した。', '{双方|そうほう}が{少|すこ}し{譲歩|じょうほ}した。', 'Hai bên đều nhượng bộ một chút.'],
      ['慎重', 'しんちょう', 'thận trọng', 'Tính từ な', '契約は慎重に確認したい。', '{契約|けいやく}は{慎重|しんちょう}に{確認|かくにん}したい。', 'Tôi muốn kiểm tra hợp đồng một cách thận trọng.']
    ],
    grammar: [
      ['〜を余儀なくされる', 'buộc phải, đành phải', 'Danh từ chỉ hành động + を余儀なくされる', 'Cách nói trang trọng nhấn mạnh hoàn cảnh khiến chủ thể phải làm điều ngoài ý muốn.', '悪天候で計画の変更を余儀なくされた。', '{悪天候|あくてんこう}で{計画|けいかく}の{変更|へんこう}を{余儀|よぎ}なくされた。', 'Do thời tiết xấu, chúng tôi buộc phải đổi kế hoạch.'],
      ['〜に堪えない', 'vô cùng, không sao kể xiết', 'Danh từ chỉ cảm xúc + に堪えない', 'Thường dùng trong văn trang trọng, như 感謝に堪えない. Với động từ như 見る, nghĩa chuyển thành không chịu nổi khi nhìn.', '皆様のご協力に感謝に堪えません。', '{皆様|みなさま}のご{協力|きょうりょく}に{感謝|かんしゃ}に{堪|た}えません。', 'Chúng tôi vô cùng biết ơn sự hợp tác của quý vị.'],
      ['〜ないまでも', 'dù chưa đến mức… thì ít nhất…', 'Động từ thể ない + までも', 'Hạ mức kỳ vọng từ một chuẩn cao ở vế đầu xuống yêu cầu thực tế hơn ở vế sau.', '全文を読まないまでも、要点は確認してほしい。', '{全文|ぜんぶん}を{読|よ}まないまでも、{要点|ようてん}は{確認|かくにん}してほしい。', 'Dù không đọc hết, tôi mong bạn ít nhất kiểm tra các ý chính.']
    ],
    reading: ['Đọc kết quả khảo sát', '新制度の導入後、満足度に顕著な上昇が見られた。ただし、調査の回答者は主に制度を積極的に利用した人々だった。この結果だけで制度がすべての対象者に有効だと判断するのは早計である。利用を控えた人の事情も把握する必要がある。', '', 'Mức hài lòng tăng rõ rệt sau khi áp dụng chế độ mới. Tuy vậy, người trả lời chủ yếu là người tích cực sử dụng chế độ. Kết quả này chưa đủ để kết luận có hiệu quả với mọi nhóm. Cần hiểu hoàn cảnh của người ít sử dụng.'],
    listening: ['Đánh giá sau thí điểm', '試行の結果から一定の改善は確認できました。しかし、比較対象の選び方によって結論が変わる可能性があります。導入を否定するわけではありませんが、判断を下す前に別の条件でも検証すべきです。', 'Kết quả thí điểm cho thấy một mức cải thiện nhất định. Tuy nhiên kết luận có thể đổi theo cách chọn đối tượng so sánh. Tôi không bác bỏ triển khai, nhưng nên kiểm chứng ở điều kiện khác trước khi quyết định.']
  }
]

