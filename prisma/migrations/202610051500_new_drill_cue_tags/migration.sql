-- Add six new drill library videos to default CoachCue rows without overwriting edited cues.

UPDATE "CoachCue"
SET "drillIds" = array_prepend('1233143528', "drillIds")
WHERE "id" = 'default_cue_week_01'
  AND NOT ('1233143528' = ANY("drillIds"));

UPDATE "CoachCue"
SET "drillIds" = array_prepend('1233142509', "drillIds")
WHERE "id" = 'default_cue_week_02'
  AND NOT ('1233142509' = ANY("drillIds"));

UPDATE "CoachCue"
SET "drillIds" = ARRAY['1233143083', '1200422514', '1200422517']
WHERE "id" = 'default_cue_week_04'
  AND "drillIds" = ARRAY['1200422517', '1200422515', '1207510044', '1200422514', '1207509269', '1207507965'];

UPDATE "CoachCue"
SET "drillIds" = array_prepend('1233143083', "drillIds")
WHERE "id" = 'default_cue_week_04'
  AND NOT ('1233143083' = ANY("drillIds"))
  AND "drillIds" <> ARRAY['1200422517', '1200422515', '1207510044', '1200422514', '1207509269', '1207507965'];

UPDATE "CoachCue"
SET "drillIds" = array_prepend('1233142709', "drillIds")
WHERE "id" = 'default_cue_week_11'
  AND NOT ('1233142709' = ANY("drillIds"));

UPDATE "CoachCue"
SET "drillIds" = CASE
  WHEN '1233142509' = ANY("drillIds") THEN "drillIds"
  ELSE array_prepend('1233142509', "drillIds")
END
WHERE "label" = 'Keep your hands inside the ball'
  AND NOT ('1233142509' = ANY("drillIds"));

UPDATE "CoachCue"
SET "drillIds" = CASE
  WHEN '1233143083' = ANY("drillIds") THEN "drillIds"
  ELSE array_prepend('1233143083', "drillIds")
END
WHERE "label" = 'Keep your hands inside the ball'
  AND NOT ('1233143083' = ANY("drillIds"));
