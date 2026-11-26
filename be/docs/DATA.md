# Dữ liệu và giấy phép

| Nguồn | Nội dung dùng |
| --- | --- |
| [OpenJLPT tại commit đã ghim](https://github.com/evanclan/OpenJLPT/tree/0d1d3410bec90bd4098a7c72de820543cb4f707c) | Từ vựng, Kanji, ngữ pháp, ví dụ và nhãn cấp JLPT. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) và [NOTICE](https://github.com/evanclan/OpenJLPT/blob/0d1d3410bec90bd4098a7c72de820543cb4f707c/NOTICE.md). |
| [JMdict và KANJIDIC2 © EDRDG](https://www.edrdg.org/edrdg/licence.html) | Các trường từ điển và Kanji được tiếp nhận qua OpenJLPT. Xem [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html) và [KANJIDIC](https://www.edrdg.org/wiki/KANJIDIC_Project.html). |
| [Jonathan Waller](https://www.tanos.co.uk/jlpt/) | Danh sách cấp độ cộng đồng và nghĩa từ ngắn qua OpenJLPT. |
| [Tatoeba](https://tatoeba.org/en/downloads) | Ví dụ văn bản qua OpenJLPT, có liên kết về câu và người đóng góp khi nguồn cung cấp ID. [CC BY 2.0 FR](https://creativecommons.org/licenses/by/2.0/fr/). |
| [Unihan 17.0.0](https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip) | Trích `kVietnamese` và chuẩn hóa để hỗ trợ tra âm Hán Việt. [Unicode License v3](https://www.unicode.org/license.txt). |
| [Danh sách Hán Việt của Phong Phan](https://github.com/ph0ngp/hanviet-pinyin-wordlist/tree/b9923df92c8b55f013001390e37cddd35e986dc1) | Âm Hán Việt của từng chữ trong từ vựng, đối chiếu với các biến thể trong Unihan. Dấu `/` phân tách các âm của cùng một chữ. [Giấy phép MIT](LICENSE-han-viet.txt). |
| [KanjiVG r20260714](https://github.com/KanjiVG/kanjivg/releases/tag/r20260714) | Chuyển các đường dẫn SVG gốc thành danh sách nét có thứ tự. © Ulrich Apel. Phần sơ đồ giữ [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). |
| [Supertonic 3](https://huggingface.co/supertone-oss-archive/supertonic-3) | Năm bản thu tổng hợp giọng F1, từ kịch bản tiếng Nhật của dự án. Các tệp WAV là đầu ra; điều khoản sử dụng mô hình và đầu ra ghi trong [OpenRAIL-M](https://huggingface.co/supertone-oss-archive/supertonic-3/blob/main/LICENSE). |
| [Inter](https://github.com/google/fonts/tree/main/ofl/inter) | Font giao diện tự phục vụ. [Bản SIL OFL đi kèm](../../fe/public/fonts/OFL-Inter.txt). |
| [Từ điển Nhật – Việt Bunchaway](https://github.com/bunchaway/tu-dien-nhat-viet/tree/6b1e9248c5382949115ccf1f5e8846d0fc85d6ad) | Nghĩa từ vựng theo cách viết. Nihongo Master đối chiếu biến thể và tách các nghĩa. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). |
| [VietAI EnViT5](https://huggingface.co/VietAI/envit5-translation) | Dịch tự động những nghĩa, giải thích ngữ pháp và câu ví dụ còn cần tiếng Việt, từ nội dung OpenJLPT. Dùng [bản CTranslate2 int8 đã ghim](https://huggingface.co/luigi000/envit5-translation-ct2-int8/tree/f68ae0e2639dacde555fe91a36b74d662848d681), giấy phép OpenRAIL. [Bài báo MTet](https://arxiv.org/abs/2210.05610). |

Lớp nghĩa và câu ví dụ tiếng Việt đi kèm trong [tệp dữ liệu](../data/vietnamese-dictionary.json). Lệnh `npm run db:import` dùng trực tiếp tệp này. Các mục có nghĩa từ Bunchaway được lấy theo cách viết của từ hoặc biến thể OpenJLPT. Với các mục đồng tự có nhiều cách đọc trong OpenJLPT, dùng bản dịch theo nghĩa gốc của từng mục. Trạng thái nghĩa phân biệt nội dung đã duyệt, nghĩa lấy từ nguồn và bản dịch tự động.

Để tái tạo lớp tiếng Việt, chuẩn bị `be/.cache/data/openjlpt.sqlite` từ OpenJLPT được ghim, `be/.cache/data/bunchaway.csv` từ `final.csv` của Bunchaway tại commit trên, và bốn tệp mô hình (`config.json`, `model.bin`, `shared_vocabulary.json`, `spiece.model`) từ bản EnViT5 đã ghim trong `be/.cache/translate/envit5`. Cài `ctranslate2==4.9.0` và `sentencepiece==0.2.3` cho Python rồi chạy `node scripts/build-vietnamese-data.mjs --translate` trong `be/`. Tệp bộ nhớ đệm cho phép chạy tiếp từ phần đã dịch.

Phần dữ liệu chuyển đổi từ OpenJLPT giữ CC BY-SA 4.0. Nihongo Master chuẩn hóa Unicode, lập chỉ mục tìm kiếm, tạo liên kết giữa các mục và bổ sung các trường nguồn riêng. Âm thanh, bài đọc và ví dụ Nhật–Việt gốc do dự án biên soạn hoặc tổng hợp.

JLPT không phát hành danh sách bắt buộc theo cấp cho bài thi hiện hành. [FAQ của JLPT](https://www.jlpt.jp/e/faq/index.html)

