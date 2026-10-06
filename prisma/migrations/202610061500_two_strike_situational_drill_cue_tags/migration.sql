-- Add six new drill library videos to default CoachCue rows without overwriting edited cues.

UPDATE "CoachCue"
SET "drillIds" = array_prepend('1233463927', "drillIds")
WHERE "id" = 'default_cue_week_08'
  AND NOT ('1233463927' = ANY("drillIds"));

UPDATE "CoachCue"
SET "drillIds" = array_prepend('1233464583', "drillIds")
WHERE "id" = 'default_cue_week_08'
  AND NOT ('1233464583' = ANY("drillIds"));

UPDATE "CoachCue"
SET "drillIds" = array_prepend('1233464969', "drillIds")
WHERE "id" = 'default_cue_week_10'
  AND NOT ('1233464969' = ANY("drillIds"));

UPDATE "CoachCue"
SET "drillIds" = array_prepend('1233465905', "drillIds")
WHERE "id" = 'default_cue_week_11'
  AND NOT ('1233465905' = ANY("drillIds"));
