"""Generate Vietnamese translations offline from a pinned EnViT5 CTranslate2 model."""

import json
import re
import sys
from pathlib import Path

import ctranslate2
import sentencepiece


def main():
    model, input_path, output_path = map(Path, sys.argv[1:])
    sentences = json.loads(input_path.read_text(encoding="utf-8"))
    output = json.loads(output_path.read_text(encoding="utf-8")) if output_path.exists() else {}
    remaining = sorted((text for text in sentences if text not in output), key=len)
    translator = ctranslate2.Translator(str(model), device="cpu", compute_type="int8", intra_threads=6)
    tokenizer = sentencepiece.SentencePieceProcessor(model_file=str(model / "spiece.model"))
    temp_path = output_path.with_suffix(".tmp")
    for start in range(0, len(remaining), 256):
        texts = remaining[start : start + 256]
        tokens = [pieces + ["</s>"] for pieces in tokenizer.encode(["en: " + text for text in texts], out_type=str)]
        translations = translator.translate_batch(tokens, beam_size=1, max_batch_size=48, max_decoding_length=196)
        for text, result in zip(texts, translations, strict=True):
            decoded = tokenizer.decode(result.hypotheses[0])
            output[text] = re.sub(r"^(?:\S{1,3}\s+)?(?:en|vi)\s*:\s*", "", decoded).strip()
        temp_path.write_text(json.dumps(output, ensure_ascii=False), encoding="utf-8")
        temp_path.replace(output_path)
        print(f"Translated {min(start + len(texts), len(remaining))}/{len(remaining)} new strings", flush=True)


if __name__ == "__main__":
    main()
