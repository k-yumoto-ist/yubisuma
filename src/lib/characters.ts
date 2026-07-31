import type { CharacterId, CharacterProfile } from "./types";

export const characters: CharacterProfile[] = [
  {
    id: "nagi",
    name: "ナギ",
    title: "風読みのランナー",
    personality: "軽やかで勝負勘が鋭い、街角アリーナのスプリンター。",
    difficulty: 1,
    colors: { primary: "#35c9b2", accent: "#ffcf5a", ink: "#102b3b", glow: "#63ffe0", stage: "#103d4a" },
    badge: "BEGINNER",
    art: "nagi",
    quotes: {
      intro: "風向き、読めるかな？ まずは楽しくいこう！",
      success: "いいね、そのリズム！",
      miss: "あれ、風が変わった？",
      pinch: "まだ走れる。ここからだよ！",
      defeat: "次はもっと速く読むね。",
      victory: "ゴール！ 風はぼくの味方だね。"
    },
    ai: { randomness: 0.58, shortMemory: 0.25, longMemory: 0.05, prediction: 0.2, repeatAvoidance: 0.15, bluff: 0.05, risk: 0.35 }
  },
  {
    id: "momo",
    name: "モモ",
    title: "ミスティック・ディーラー",
    personality: "カードと星をめくりながら、少し先の癖を読む占い師。",
    difficulty: 2,
    colors: { primary: "#ef82b9", accent: "#8f8cff", ink: "#35213d", glow: "#ffb5dc", stage: "#43294d" },
    badge: "RHYTHM",
    art: "momo",
    quotes: {
      intro: "カードは伏せたまま。運命だけ、ちょっと覗くね。",
      success: "ほら、星が同じ数字を指してる。",
      miss: "うふふ、今日は気まぐれな星ね。",
      pinch: "まだ一枚、切り札を隠してるよ。",
      defeat: "運命の続きは、また今度。",
      victory: "いい夜だったね。勝負は美しく！"
    },
    ai: { randomness: 0.38, shortMemory: 0.48, longMemory: 0.16, prediction: 0.42, repeatAvoidance: 0.32, bluff: 0.16, risk: 0.42 }
  },
  {
    id: "kaito",
    name: "カイト",
    title: "ロジック・ギア",
    personality: "計測と検証が好きな、静かな分析型のメカニック。",
    difficulty: 3,
    colors: { primary: "#5b9fff", accent: "#b9efff", ink: "#122c4e", glow: "#73c6ff", stage: "#18365d" },
    badge: "ANALYST",
    art: "kaito",
    quotes: {
      intro: "過去12ラウンドを解析。君の次の手、予測開始。",
      success: "一致。仮説どおりの結果だ。",
      miss: "データ不足。再計算する。",
      pinch: "警戒レベルを上げる。まだ終わっていない。",
      defeat: "想定外の揺らぎ。ログを更新しておく。",
      victory: "勝率の高い手順が、実証された。"
    },
    ai: { randomness: 0.24, shortMemory: 0.7, longMemory: 0.42, prediction: 0.62, repeatAvoidance: 0.55, bluff: 0.2, risk: 0.5 }
  },
  {
    id: "ritsu",
    name: "リツ",
    title: "ビート・マスター",
    personality: "音と勢いで相手のテンポを崩す、派手好きなDJ。",
    difficulty: 4,
    colors: { primary: "#ff7b55", accent: "#ffe27a", ink: "#40251e", glow: "#ffab68", stage: "#563329" },
    badge: "BEAT",
    art: "ritsu",
    quotes: {
      intro: "指先でビートを刻もう。ノれる方が勝ち！",
      success: "ドロップ来た！ そのまま行くよ！",
      miss: "ビートがズレた？ それもグルーヴ！",
      pinch: "静かになった？ ここが一番アガる！",
      defeat: "今日のアンコールは君にあげる。",
      victory: "フロア総立ち！ 最高のセッションだね。"
    },
    ai: { randomness: 0.22, shortMemory: 0.58, longMemory: 0.3, prediction: 0.52, repeatAvoidance: 0.86, bluff: 0.52, risk: 0.62 }
  },
  {
    id: "juna",
    name: "ジュナ",
    title: "スパイス・シェフ",
    personality: "大胆な一手と細やかな観察を使い分ける、勝負師の料理人。",
    difficulty: 5,
    colors: { primary: "#f4b94c", accent: "#f27c66", ink: "#3f2a19", glow: "#ffdc77", stage: "#5b4022" },
    badge: "EXPERT",
    art: "juna",
    quotes: {
      intro: "材料はそろった。あとは最高の一手を仕上げるだけ。",
      success: "完璧な火入れ。味が決まったね。",
      miss: "少し焦げたかな。でも次は整えるよ。",
      pinch: "鍋底のソースは、最後まで秘密。",
      defeat: "見事な一皿。レシピを教えてほしいな。",
      victory: "ごちそうさま。勝負も、料理も、余韻が大事。"
    },
    ai: { randomness: 0.14, shortMemory: 0.8, longMemory: 0.62, prediction: 0.72, repeatAvoidance: 0.7, bluff: 0.42, risk: 0.74 }
  },
  {
    id: "volt",
    name: "ヴォルト",
    title: "アリーナ・オーバーロード",
    personality: "観客の熱量まで読み、短期と長期の流れを支配するボス。",
    difficulty: 6,
    colors: { primary: "#a98bff", accent: "#68f1ff", ink: "#1b173d", glow: "#9fceff", stage: "#2e235c" },
    badge: "BOSS",
    art: "volt",
    quotes: {
      intro: "最終ゲートへようこそ。読み合いの深さを見せてみろ。",
      success: "その揺らぎ、すでに見えていた。",
      miss: "ほう。予測の外側へ踏み込んだか。",
      pinch: "追い込まれた時の選択こそ、最も饒舌だ。",
      defeat: "このアリーナを越えたか。君の勝ちだ。",
      victory: "全ての指先は、私の盤上にある。"
    },
    ai: { randomness: 0.1, shortMemory: 0.9, longMemory: 0.8, prediction: 0.84, repeatAvoidance: 0.84, bluff: 0.72, risk: 0.82 }
  }
];

export const characterMap = Object.fromEntries(characters.map((character) => [character.id, character])) as Record<
  CharacterId,
  CharacterProfile
>;

export function getCharacter(id: CharacterId | undefined): CharacterProfile {
  return characterMap[id ?? "nagi"] ?? characterMap.nagi;
}
