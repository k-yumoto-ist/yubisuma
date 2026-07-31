# 指スマ ARENA 設計メモ

## 1. ラウンド状態

```text
setup
  └─ playerChoosingCall / cpuChoosingCall
       └─ playerChoosingHands / playerResponding
            └─ localChoosingHands → handoff → localResponding（ローカルのみ）
                 └─ readyToReveal
                      └─ countdown → reveal → judging
                           ├─ roundResult → 次のターン
                           └─ matchResult
```

`MatchState`と`matchReducer`が、画面コンポーネントから独立した唯一の対戦状態です。UIは合法なイベントだけをdispatchし、`reveal`と`resolve`はフェーズを検証するため同一ラウンドの二重処理を拒否します。

## 2. ターン仕様

- 成功: 宣言した側の親指を1本減らし、同じ側が続けて宣言する。
- 失敗: 親指は変わらず、反対側へターンを渡す。
- 0本になった時点で、その側の勝利。追加イベントは発生しない。
- 1本の側の手は`legalHandValues(1)`で0/1に限定。
- 宣言範囲は両者の残り親指の合計を上限にする。

## 3. 非同期演出

対戦盤は`countdown`への遷移を検知し、短いタイマー列で「いっ」「せーの」「指スマ！」を表示します。各列はmatch idとroundから作ったキー、画面遷移時に無効化するtokenを持ちます。画面を離れた後に`resolve`がdispatchされないようにしています。

## 4. CPUの情報境界

CPUの公開APIには現在のプレイヤーの手を渡しません。CPUが利用できるのは履歴の`hands`、既に画面へ表示された宣言、現在の残り親指だけです。テストでは同じ観測値・seedから再現できることと、全キャラクターの出力が合法値であることを確認します。

## 5. アートとサウンド

手SVGは各手の掌、指、折れた親指、上がった親指を別パスで描画します。キャラクターSVGは共通の顔骨格に、髪、服、装具、表情差分をキャラクター別に合成します。状態クラスで構え、公開、成功、失敗、脱落を表現します。

音はユーザーのbutton操作後にAudioContextをunlockして、選択、宣言、カウント、公開、成功、失敗、脱落、勝敗を波形の組み合わせで生成します。音量、SFX、BGM、振動、演出速度は設定へ保存されます。
