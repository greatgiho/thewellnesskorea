export type PathKey = "bium" | "kkaeum" | "jieum" | "chaeum" | "nurim"

export type Path = {
  key: PathKey
  order: number
  image: string
  ko: string
  en: string
  sloganKo: string
  enDesc: string
  programs: string[]
  vibe?: string
  targetNote?: string
}

export const PATHS: Path[] = [
  {
    key: "bium",
    order: 1,
    image: "/path-bium.png",
    ko: "비움",
    en: "Bium (Emptying)",
    sloganKo: "생각과 스트레스를 털어내는 명상과 쉼",
    enDesc:
      "Meditative practices and deep rest to clear the mind and release daily stress.",
    programs: [
      "싱잉볼 사운드 배스",
      "침묵 명상",
      "회복을 위한 멍 때리기(Rest) 세션",
    ],
    vibe: "브릭웰 중정의 고요함을 바라보며 머리를 비워내는 시간",
  },
  {
    key: "kkaeum",
    order: 2,
    image: "/path-kkaeum.png",
    ko: "깨움",
    en: "Kkaeum (Awakening)",
    sloganKo:
      "굳어있던 몸과 생명력을 깨우는 요가, 전통 무용, 그리고 움직임",
    enDesc:
      "Yoga, traditional Korean dance, and dynamic movement to awaken the body and revive inner vitality.",
    programs: [
      "하타/빈야사 요가",
      "한국 전통 무용(호흡과 선을 활용한 리추얼 댄스)",
      "소매틱 무브먼트",
      "호흡법(Breathwork)",
    ],
    vibe:
      "한국적인 아름다운 선(Line)과 현대적인 움직임이 결합하여, 몸의 결을 따라 생명력을 깨우는 시간",
  },
  {
    key: "jieum",
    order: 3,
    image: "/path-jieum.png",
    ko: "지음",
    en: "Jieum (Crafting)",
    sloganKo: "한국 전통 예술을 손끝으로 빚어내는 몰입의 시간",
    enDesc:
      "Creative and mindful crafting of Korean traditional heritage to experience deep artistic immersion.",
    programs: [
      "한국 전통 민화 그리기",
      "전통 도예 클래스",
      "다도(茶道) 비기너 클래스",
    ],
    targetNote:
      "외국인 관광객의 한국 문화 체험, 어린이의 오감 발달 및 성인들의 아티스틱 명상 몰입(Flow)",
  },
  {
    key: "chaeum",
    order: 4,
    image: "/path-chaeum.png",
    ko: "채움",
    en: "Chaeum (Nourishing)",
    sloganKo: "좋은 에너지를 몸속에 들여놓는 웰니스 F&B",
    enDesc:
      "Premium wellness F&B and tea rituals to nourish your body with clean, mindful energy.",
    programs: [
      "정성스러운 차(Tea) 세레모니",
      "로컬 제철 비건 케이터링",
      "전통 약선 디저트 페어링",
    ],
    vibe: "나를 귀하게 대접하는 환대(禮)와 정갈한 음미의 시간",
  },
  {
    key: "nurim",
    order: 5,
    image: "/path-nurim.png",
    ko: "누림",
    en: "Nurim (Savoring)",
    sloganKo: "브릭웰의 자연과 문화 공연을 온전히 즐기는 시간",
    enDesc:
      "An immersive time to fully savor Brickwell's nature and curated cultural performances.",
    programs: [
      "브릭웰 대나무 숲과 어우러지는 라이브 앰비언트 공연",
      "사운드 아트",
      "프라이빗 전시",
    ],
    vibe:
      "건축물의 아름다움과 계절의 변화를 오감으로 누리는 풍류의 시간",
  },
]

export const PATH_KEYWORDS = PATHS.map((p) => ({
  value: p.ko,
  label: p.en.replace(/\s*\(.*\)/, "").trim(),
}))

export const PATH_OPTIONS = PATHS.map((p) => ({
  key: p.key,
  labelKo: p.ko,
  labelEn: p.en.replace(/\s*\(.*\)/, "").trim(),
}))

export function pathLabelKo(key: PathKey): string {
  return PATHS.find((p) => p.key === key)?.ko ?? key
}
