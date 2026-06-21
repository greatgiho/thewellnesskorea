-- Journal posts (platform stories: Core region/taste + Space/programs)

create type public.journal_category as enum (
  'philosophy',
  'space',
  'programs',
  'news',
  'region',
  'taste'
);

create table if not exists public.journal_posts (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title_en          text not null,
  title_ko          text,
  excerpt_en        text not null,
  body_en           text not null default '',
  hero_image_path   text,
  category          public.journal_category not null default 'news',
  published_at      timestamptz not null default now(),
  read_minutes      int not null default 5 check (read_minutes > 0),
  is_published      boolean not null default false,
  experience_id     uuid references public.experiences(id) on delete set null,
  seo_title         text,
  seo_description   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists journal_posts_published_idx
  on public.journal_posts (is_published, published_at desc);

create index if not exists journal_posts_category_idx
  on public.journal_posts (category, published_at desc);

create trigger journal_posts_updated_at
  before update on public.journal_posts
  for each row execute function public.set_updated_at();

alter table public.journal_posts enable row level security;

create policy "public read published journal posts"
  on public.journal_posts for select
  using (is_published = true);

create policy "admin all on journal posts"
  on public.journal_posts for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'journal-photos',
  'journal-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "public read journal photos"
  on storage.objects for select
  using (bucket_id = 'journal-photos');

create policy "admin upload journal photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'journal-photos' and public.is_admin_user());

create policy "admin update journal photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'journal-photos' and public.is_admin_user());

create policy "admin delete journal photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'journal-photos' and public.is_admin_user());

-- Seed published posts (editorial copy — see lib/journal/seed-content.ts)
insert into public.journal_posts (
  slug,
  title_en,
  title_ko,
  excerpt_en,
  body_en,
  hero_image_path,
  category,
  published_at,
  read_minutes,
  is_published
)
values
  (
    'live-the-time-more-fully',
    'Live the time given to you, more fully.',
    '주어진 시간을, 더 온전히.',
    'Wellness is not a product you buy once. It is the way a day opens—through stillness, movement, craft, nourishment, and the joy of being present.',
    E'Korean culture has long understood that a life well lived is not faster, but clearer. Empty the mind. Awaken the body. Craft with care. Nourish with what the season offers. Savor the moment—including the quiet joy of gathering.\n\nWe call this rhythm the five paths: Bium (stillness), Kkaeum (movement), Jieum (craft), Chaeum (nourishment), and Nurim (joy). They are not separate wellness trends. They are one continuous breath.\n\n> We do not promise transformation in an hour. We offer practices that help time feel wider—not stolen back, but lived.\n\n## Why a platform, not a single studio\n\nThe Wellness Korea begins at Brickwell in Seochon, but it is not limited to one address. Spaces hold daily life. Journeys will carry you to regions where the land itself teaches pace. This Journal holds the stories that connect them—philosophy, places, people, and the taste of a particular season.\n\nIf you are new here, meet a Wellness Guide on the homepage, browse the schedule, and return when you want the longer view.',
    '/kw-philosophy.png',
    'philosophy',
    '2026-06-02T00:00:00+00',
    7,
    true
  ),
  (
    'brickwell-seochon-space',
    'Brickwell: the well at the center of Seochon',
    'Brickwell: 서촌 한가운데 우물',
    'Near Gyeongbokgung, down alleys where morning light arrives slowly, Brickwell is a courtyard Space for classes, stillness, and sound—four floors, one unhurried rhythm.',
    E'Seochon does not perform for visitors. Laundry lines cross narrow lanes. An elder passes with a market bag. Somewhere a gate opens onto a courtyard where light pools differently than on the main road. Brickwell takes its name from the well at the center of that courtyard—a place to draw water, pause, and continue.\n\nWe built four floors not to fill every hour, but to hold distinct tones: movement on the lower levels, meditation and breath above, sound and smaller gatherings higher still. Sessions begin and end with margin. Arrival should feel like stepping out of the city''s hurry, not into another queue.\n\n## What you will find on the schedule\n\nClasses are led by Wellness Guides and Artists who live these paths in their work—yoga and breath, meditation, gugak and Korean dance, tea and seasonal conversation. The schedule on our homepage shows what is confirmed and open for booking; it changes week by week, as living spaces do.\n\n## A showroom, not a spectacle\n\nBrickwell is where our philosophy becomes sensory: plaster walls, natural light, the sound of a class ending while the next guest waits without impatience. Partners in food and craft will appear here over time—not as retail shelves, but as stories told in the same room as a morning class.\n\nIf you are planning a visit, start with the schedule. The courtyard will be here when you arrive.',
    '/kw-brickwell.png',
    'space',
    '2026-05-27T00:00:00+00',
    6,
    true
  ),
  (
    'slow-mornings-on-jeju',
    'Jeju in winter light: oreum, citrus, and the pace of stone',
    '겨울 빛 제주: 오름, 감귤, 돌의 속도',
    'Local discovery is not a checklist. On Jeju, a single morning—wind off the oreum, tea from a grove that knows frost—can be the whole journey.',
    E'Jeju is often photographed from above: a green island in a blue sea. That image is true and incomplete. To know Jeju you must walk at the speed of its stone walls—low, patient, built to turn wind rather than fight it.\n\nIn late winter the citrus groves carry a sweetness sharpened by cold nights. Mist sits in the caldera of an oreum long after the sun has cleared the coast. A guest who rises early might hear only their boots on volcanic path and the distant sea—not silence as absence, but silence as room to think.\n\n> Local tourism, for us, is attention. Not how many places you tick off, but how deeply one place allows you to breathe.\n\n## What we look for in a regional Journey\n\nWhen The Wellness Korea travels beyond Seoul, we ask the same questions we ask of Brickwell: Does the land suggest a pace? Is there a craft, a meal, or a sound that belongs only here? Can a Wellness Guide and an Artist hold a program that would feel wrong anywhere else?\n\nOn Jeju that might mean a morning walk along a low oreum, tea with someone who knows which hillside was picked after the first frost, and an evening where gugak responds to the rhythm of the coast—not as background music, but as conversation with place.\n\n## Not yet on the calendar\n\nOur first Jeju Journey is still taking shape. When dates open, they will appear alongside Brickwell on the homepage. Until then, this is the view from the path: why we care about regions at all, and why we will not rush a program that is not ready.\n\nIf Jeju is already calling to you, begin with stillness at home. The island will wait without impatience.',
    '/path-bium.png',
    'region',
    '2026-06-10T00:00:00+00',
    8,
    true
  ),
  (
    'season-and-ferment',
    'Doenjang, green tea, and the time inside flavor',
    '된장, 녹차, 맛 안에 있는 시간',
    'Korean food is fermented time and picked weather. We partner with makers who treat taste as wellness—not calories, but season, place, and patience.',
    E'A bowl of doenjang jjigae carries months in an earthenware jar—soybeans transformed by hands that check the ferment each day, not because a label demands it, but because the jar tells them when. A spring green tea carries a hillside and a rain pattern you will never see on the package.\n\nWe do not talk about "clean eating" as punishment. We talk about nourishment as Chaeum—one of the five paths—where what you take in supports the rhythm of the day you are trying to live.\n\n## Taste at Brickwell\n\nIn our Space, food appears slowly and deliberately: tea before or after class, seasonal small plates that change with what growers bring, conversations that begin at a table and continue in the Journal. A partner who joins Brickwell is not renting shelf space. They are joining a story—region, season, and the hands that waited.\n\n## What we publish under Local Taste\n\nHere you will read about makers we trust: a brewery in Gangwon that ages on mountain air, a tea house that harvests once and speaks of that year for months, a baker who ferments dough the way others meditate. We name them when the relationship is real, not when a press release arrives.\n\n> Good food, like good wellness, cannot be rushed. The same is true of good partnership.\n\nWhen you visit Brickwell, taste what is on offer that week. When you travel, carry these stories to the regions they describe. That is how offline and online stay one thread—not commerce first, but care first.',
    '/kw-tea.png',
    'taste',
    '2026-06-12T00:00:00+00',
    7,
    true
  )
on conflict (slug) do nothing;
