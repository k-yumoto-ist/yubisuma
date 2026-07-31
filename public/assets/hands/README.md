# 完成済み手アセット

このディレクトリには、完成済みの手画像を配置します。

必要なファイル名は次の4つです。

- `fist-left.svg` または `fist-left.png`
- `fist-right.svg` または `fist-right.png`
- `thumb-up-left.svg` または `thumb-up-left.png`
- `thumb-up-right.svg` または `thumb-up-right.png`

必要に応じて、使用不可状態を専用画像で表現する場合は次も配置できます。

- `disabled-fist-left.svg` または `disabled-fist-left.png`
- `disabled-fist-right.svg` または `disabled-fist-right.png`
- `disabled-thumb-up-left.svg` または `disabled-thumb-up-left.png`
- `disabled-thumb-up-right.svg` または `disabled-thumb-up-right.png`

アプリ側は、画像の輪郭や親指をコードで生成せず、次の状態だけを画像ファイルの切替で表示します。

- `availableThumbs.left/right`: 使用可能な親指
- `selectedThumbs.left/right`: 今回出す親指
- `revealedThumbs.left/right`: 公開された親指

右手画像を反転して左手へ流用する場合は、画像内に文字・左右固有の陰影・方向性のある装飾を入れないでください。画像の縦横比は左右で揃え、透明背景を使用してください。

4つのPNGはユーザー提供画像から切り出した完成済みアセットです。アプリは`HandGraphic`から`handAssets.ts`の画像パスを選択し、旧SVG生成を使用しません。

出典: この作業でユーザーが添付した画像。公開範囲を広げる場合は、元画像の利用許諾・ライセンスを確認してください。
