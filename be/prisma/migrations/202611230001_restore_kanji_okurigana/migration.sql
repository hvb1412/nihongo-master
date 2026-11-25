-- Restore the separators omitted from the original curated Kanji readings.
WITH corrections(title, readings) AS (
  VALUES
    ('学', '{"まなぶ": "まな.ぶ"}'::jsonb),
    ('生', '{"いきる": "い.きる", "うまれる": "う.まれる"}'::jsonb),
    ('決', '{"きめる": "き.める", "きまる": "き.まる"}'::jsonb),
    ('続', '{"つづく": "つづ.く", "つづける": "つづ.ける"}'::jsonb),
    ('効', '{"きく": "き.く"}'::jsonb),
    ('顕', '{"あらわれる": "あらわ.れる"}'::jsonb),
    ('譲', '{"ゆずる": "ゆず.る"}'::jsonb),
    ('慎', '{"つつしむ": "つつし.む"}'::jsonb)
)
UPDATE "Content" AS item
SET data = jsonb_set(item.data, '{kun}', (
  SELECT jsonb_agg(COALESCE(corrections.readings -> kun.reading, to_jsonb(kun.reading)) ORDER BY kun.position)
  FROM jsonb_array_elements_text(item.data -> 'kun') WITH ORDINALITY AS kun(reading, position)
)),
"updatedAt" = CURRENT_TIMESTAMP
FROM corrections
WHERE item.kind = 'KANJI'
  AND item.title = corrections.title
  AND item."sourceId" IN ('nihongo-master', 'openjlpt')
  AND (item.data -> 'kun') ?| ARRAY(SELECT jsonb_object_keys(corrections.readings));
