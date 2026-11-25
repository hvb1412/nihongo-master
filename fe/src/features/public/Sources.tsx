import { Badge, PageHeading, Resource } from '../../shared/ui'
import type { Source } from '../../shared/types'
import { useResource } from '../../shared/use-resource'

export function Sources() {
  const resource = useResource<Source[]>('/catalog/sources')
  return <>
    <PageHeading title="Nguồn dữ liệu và giấy phép" />
    <p className="muted">Nhãn JLPT dựa trên danh sách tham khảo. Trang từ điển ghi nguồn nghĩa tiếng Việt và các mục dùng bản dịch tự động.</p>
    <Resource {...resource}>{sources => <div className="grid two mt-5">{sources.map(source => <article key={source.id} className="surface panel flow">
      <Badge>{source.license}</Badge><h2>{source.name}</h2><p>{source.notice}</p>
      {source.url.startsWith('https://') && <a href={source.url}>Xem nguồn</a>}
    </article>)}</div>}</Resource>
    <ul className="credits">
      <li><a href="https://github.com/evanclan/OpenJLPT/blob/main/NOTICE.md">Ghi công OpenJLPT</a> · <a href="https://www.edrdg.org/edrdg/licence.html">JMdict và KANJIDIC2 © EDRDG</a> · <a href="https://www.tanos.co.uk/jlpt/">Danh sách Jonathan Waller</a></li>
      <li><a href="https://tatoeba.org/en/downloads">Tatoeba</a> · <a href="https://creativecommons.org/licenses/by/2.0/fr/">CC BY 2.0 FR</a></li>
      <li><a href="https://huggingface.co/VietAI/envit5-translation">VietAI EnViT5</a> · <a href="https://arxiv.org/abs/2210.05610">Bài báo MTet</a></li>
      <li><a href="https://huggingface.co/supertone-oss-archive/supertonic-3">Supertonic 3 · Giọng đọc tổng hợp cho các bài nghe mẫu</a></li>
    </ul>
  </>
}
