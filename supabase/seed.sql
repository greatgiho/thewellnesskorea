-- Optional seed: run after migrations. Upload photos via /admin/partners after.
insert into public.partners (slug, kind, name_ko, name_en, role_ko, role_en, quote, modalities, sort_order, is_published)
values
  ('seo-yeon-han', 'guide', '한서연', 'Seo-yeon Han', '요가 강사', 'Yoga Teacher',
   'Movement is simply breath made visible.',
   array['Vinyasa', 'Hatha', 'Restorative'], 1, true),
  ('jun-ho-park', 'guide', '박준호', 'Jun-ho Park', '명상 가이드', 'Meditation Guide',
   'In stillness, we find our true power.',
   array['Mindfulness', 'Zen', 'Walking'], 2, true),
  ('mira-yoon', 'guide', '윤미라', 'Mira Yoon', '사운드 힐러', 'Sound Healer',
   'Let the resonance carry what words cannot.',
   array['Singing Bowls', 'Gong', 'Vibration'], 3, true),
  ('da-eun-kim', 'guide', '김다은', 'Da-eun Kim', '호흡 워크 실습가', 'Breathwork Practitioner',
   'Every exhale is a small act of letting go.',
   array['Breathwork', 'Pranayama', 'Somatic'], 4, true),
  ('tae-min-seo', 'both', '서태민', 'Tae-min Seo', '국악 연주자', 'Gugak Musician',
   'Tradition lives when we let it breathe today.',
   array['Gayageum', 'Daegeum', 'Heung'], 5, true),
  ('hee-jin-cho', 'guide', '조희진', 'Hee-jin Cho', '다례 스승', 'Tea Ceremony Master',
   'A cup of tea is an invitation to be here now.',
   array['Darye', 'Seasonal Tea', 'Ritual'], 6, true),
  ('ye-rim-jang', 'artist', '장예림', 'Ye-rim Jang', '현대무용가', 'Contemporary Dancer',
   'A held pose and a sweeping sleeve are the same breath.',
   array['Korean Dance', 'Movement', 'Heung'], 1, true),
  ('joon-seo-lim', 'artist', '임준서', 'Joon-seo Lim', '가야금 연주자', 'Gayageum Musician',
   'Tradition lives when we let it breathe today.',
   array['Gayageum', 'Gugak', 'Improvisation'], 2, true),
  ('soo-ah-moon', 'artist', '문수아', 'Soo-ah Moon', '판소리 성악가', 'Pansori Vocalist',
   'The voice carries what silence cannot hold.',
   array['Pansori', 'Voice', 'Storytelling'], 3, true),
  ('hyun-woo-baek', 'artist', '백현우', 'Hyun-woo Baek', '북 연주자', 'Buk Percussionist',
   'Every beat is an invitation to feel alive.',
   array['Buk', 'Rhythm', 'Heung'], 4, true),
  ('na-young-seo', 'artist', '서나영', 'Na-young Seo', '퍼포먼스 아티스트', 'Performance Artist',
   'We reimagine heritage as something that breathes now.',
   array['Reinterpretation', 'Stage', 'Light'], 5, true)
on conflict (slug) do nothing;

-- Programs are what the app reads; the modalities array above is legacy and on
-- its way out. Seeding only the array left local data in a shape production has
-- not been in for a long time — every partner there carries both.
insert into public.partner_programs (partner_id, title, sort_order)
select p.id, m.title, m.ord - 1
from public.partners p
cross join lateral unnest(p.modalities) with ordinality as m(title, ord)
where not exists (
  select 1 from public.partner_programs pp where pp.partner_id = p.id
);
