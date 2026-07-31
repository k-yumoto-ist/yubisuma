# 指スマ ARENA

「指スマ ARENA」は、スマートフォンとPCのブラウザで遊べる、オリジナルキャラクター対戦型の指スマゲームです。数字を宣言し、自分が出す親指の本数を選び、相手の手を読む一瞬の駆け引きを、キャラクターの表情・手の動き・効果音・カウント演出と一緒に楽しめます。

## ゲーム概要

プレイヤーとCPUは最初に2本の親指を持ちます。手番側は、両者が出す親指の合計を0〜4の範囲で宣言します。両者は0〜2本の手を同時に出し、宣言と合計が一致すると、宣言した側の親指が1本減ります。成功時は同じ側の手番が続き、外れた場合は手番が交代します。先に自分の親指を0本にした側が勝利です。

残り親指が1本のプレイヤーは0本または1本のみ出せます。宣言ボタンも、その時点の両者の残り親指から実現可能な値だけを表示します。

## ゲームモード

- クイック対戦: 6体のCPUから相手を選び、1試合を遊びます。
- アリーナモード: ナギ、モモ、カイト、リツ、ジュナ、ボスのヴォルトを順番に勝ち抜きます。階層が上がるほどCPUの履歴利用、ブラフ、リスク判断、演出強度が上がります。
- ローカル2人対戦: 同じ端末で名前を入力し、選択後に目隠しの端末受け渡し画面を挟んで交互に操作します。
- チュートリアル: 実際の対戦盤を使い、宣言、手の選択、公開、成功、勝利までを短い試合で体験できます。タイトルと設定から何度でも再実行できます。

## 対戦画面の情報設計

対戦中はスクロールを使わず、`100dvh`を基準に1画面で完結するゲーム盤として表示します。上からコンパクトなステータスバー、CPUのキャラクターと手、中央の読み合い、プレイヤーの手、下部の固定操作パネルという5領域に分けています。通常対戦では常時ガイドや長い説明を表示せず、必要な入力だけを同じ画面内で切り替えます。

数字宣言の次に出す本数を選び、完成済みの手画像アセットまたは本数ボタンへ即時反映します。公開中は中央の表示をカウント・合計・成否へ切り替え、操作中の二重処理は状態機械と入力ロックで防ぎます。320×568、375×667、390×844、430×932のモバイル幅を確認済みです。

## 技術構成

- Next.js 14 App Router / React 18 / TypeScript
- CSSによるレスポンシブUIとステージ演出（外部UIライブラリなし）
- Web Audio APIによるユーザー操作後の効果音・BGM
- localStorageのバージョン付きプロフィール保存
- PWA manifest + service worker（基本画面をキャッシュ）
- Vitestによるルール・CPU・状態機械・保存の単体テスト
- Playwrightによる主要画面・対戦フローE2Eテスト
- 外部バックエンド不要、VercelのNode/Next.jsデプロイとGitHub Pagesの静的公開に対応

## セットアップ

```bash
npm install
```

## 開発サーバー

```bash
npm run dev
```

標準では `http://localhost:3000` で起動します。別ポートを使う場合は `npm run dev -- -p 3100` のように指定できます。

## テスト・lint・型チェック・ビルド

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

`test:e2e` はPlaywrightのChromiumを利用します。初回のみ必要に応じて `npx playwright install chromium` を実行してください。

## Vercelへのデプロイ

VercelでこのディレクトリをNext.jsプロジェクトとして読み込み、Build Commandを `npm run build`、Install Commandを `npm install` のままデプロイできます。環境変数や外部データベースは必要ありません。PWAのservice workerは同一オリジンから配信されます。

```bash
npx vercel
```

## GitHub Pagesへのデプロイ

GitHub ActionsでNext.jsの静的出力を生成し、GitHub Pagesへ自動デプロイします。公開URLは次のとおりです。

`https://k-yumoto-ist.github.io/yubisuma/`

`.github/workflows/deploy-pages.yml` は `main` または公開用ブランチへのpushで実行されます。GitHubリポジトリの Settings → Pages → Build and deployment → Source は `GitHub Actions` に設定してください。GitHub Pagesではリポジトリ名のサブパス(`/yubisuma`)を使うため、Actionsのビルド時だけ `basePath` とPWAの参照先を切り替えています。ローカル開発時のURLは従来どおり `http://localhost:3000` です。

## ディレクトリ構成

```text
app/
  layout.tsx          メタデータ、viewport、PWA manifest
  page.tsx            画面遷移とUI表示。ゲームロジックはlibへ委譲
  globals.css         ステージ、レスポンシブ、アニメーション、アクセシビリティ
src/
  components/
    CharacterAvatar.tsx  6キャラクターの表情差分付きSVG
    HandGraphic.tsx      左右の完成済み手画像を状態に応じて切替
    handAssets.ts        手画像アセットのパス定義
    Particles.tsx        成功・勝利時のパーティクル
  lib/
    types.ts             状態・プロフィール・CPUの型
    rules.ts             合法な手・宣言とラウンド判定
    gameMachine.ts       明示的な対戦ステートマシン
    cpu.ts               履歴を使うCPU思考
    characters.ts        キャラクター設定、台詞、AIパラメータ
    storage.ts           バージョン付き保存と移行・復旧
    achievements.ts      称号条件
    sound.ts             Web Audio APIと振動
    random.ts            seed注入可能な乱数
tests/
  yubisuma.spec.ts       Playwright主要フロー
public/
  manifest.webmanifest   PWA設定
  sw.js                  オフライン用キャッシュ
  icon.svg               オリジナルアプリアイコン
docs/
  game-spec.md           状態機械と設計メモ
```

## CPU思考の概要

CPUは現在ラウンドのプレイヤーの未公開選択を参照しません。CPUの入力は、両者の残り親指、すでに公開されたラウンド履歴、今回CPUが見えている宣言、ターン番号だけです。

キャラクターごとに次のパラメータを持たせています。

- ランダム性
- 短期履歴と長期履歴の重み
- プレイヤーの出しやすい本数の推定精度
- プレイヤーの宣言傾向の利用
- 同じ行動を避ける強さ
- ブラフ率
- 残り親指に応じたリスク許容度

履歴から重み付きの本数分布を推定し、宣言・CPUの手を合法値へ丸めたうえで、キャラクター固有のノイズを加えます。`chooseCpuCall` と `chooseCpuHand` は `Rng` を引数に受け取れるため、テストでは `createSeededRng(seed)` を注入して再現できます。

## 保存データ

キー `yubisuma-arena-profile` に、`version: 2` のプロフィールをJSONで保存します。総試合数、勝敗、連勝、アリーナ到達、キャラクター別撃破、称号、最近の履歴、設定、チュートリアル完了を含みます。

読み込み時はJSON破損を捕捉して初期データへ復旧し、旧バージョンの勝敗カウンターと設定を現行形式へ移行します。localStorageが無効または満杯でも、対戦自体は継続できます。

## アクセシビリティ・端末対応

- 主要操作はbutton要素で、キーボード操作とフォーカスリングに対応
- 画面下部の結果・ターン状況は`aria-live`で通知
- 親指の本数と手の状態は画像コンポーネントのaria-labelで説明
- 成功・失敗は色だけでなく、「一致！」「はずれ」、合計式、台詞で表示
- `prefers-reduced-motion`を検知し、アニメーションとカウント時間を抑制
- safe-area、320px幅、縦・横画面、デスクトップ余白を考慮
- タップ領域は原則44px以上。hoverなしでも全操作可能

## 使用アセットとライセンス

キャラクター、背景表現、アイコン、パーティクルはリポジトリ内のTypeScript/JSX/CSS/SVGで作成しています。手画像はユーザー提供画像から切り出し、共通キャンバスへ整えた`public/assets/hands/fist-right.png`と`thumb-up-right.png`だけを使用します。左手は同じ画像を水平反転して表示し、左右別アセットは持ちません。元画像の公開利用許諾・ライセンス確認は公開者の責任で行ってください。外部フォント、外部音源、権利不明の効果音は使用していません。効果音と低音BGMはWeb Audio APIで波形を生成し、初回アクセス時の自動再生は行いません。

## 拡張ポイント

- `gameMachine.ts` のイベントと`rules.ts`の純粋関数を拡張すれば、ルール追加をUIから分離したまま実装できます。
- `CharacterProfile.ai` と`cpu.ts`を追加すれば、新CPUやシーズン別AIを安全に増やせます。
- `storage.ts`のプロフィールバージョンと移行関数を追加し、IndexedDBやクラウド同期へ段階的に移行できます。
- 現在の単一画面アプリ状態を、将来ルーティングが必要になった時は`Screen`と履歴処理をApp RouterのURLへ移せます。
- オンライン対戦を追加する場合も、現在のローカル状態機械をサーバー権威のイベント列へ置き換える設計が可能です。
