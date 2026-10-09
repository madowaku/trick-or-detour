# 素材と利用条件

2026-10-10時点の記録。本作向けに生成した画像とオリジナル合成音、商用利用を許可するOFLフォントを使用しています。購入したゲーム素材はありません。

## 画像

OpenAI ImageGenの組み込みツールで生成しました。CLI・外部API課金を使う生成経路には切り替えていません。添付されたタイトル画像は雰囲気の参考とし、その画像内の文字やボタンを実装画面として流用していません。

| ゲーム用ファイル | 内容 | 原本 |
| --- | --- | --- |
| `public/assets/title-forest.webp` | 月夜の森・魔女の家・仮装した子供たちのタイトル背景 | `art/source/title-forest.png` |
| `public/assets/board-forest.webp` | 真上から見た、中央が開いた森の盤面 | `art/source/board-forest.png` |
| `public/assets/halloween-atlas-v2.webp` | 子供3種類、魔女の家、おばけ、かぼちゃの6区画透明アトラス | `art/source/halloween-atlas-v2.png` |

透明アトラスは1536×1024、各区画512×512。v2では隣の素材が切り出し領域に入らないよう余白を増やしています。WebP化は寸法・アルファを保つ形式変換のみです。初稿のアトラスは `art/source/halloween-atlas.png` に保管しています。

[全生成・編集プロンプト](docs/imagegen-prompts.md) を保存しました。画像は既存の著名キャラクターやブランドを指定せずに生成しています。OpenAIとの関係における出力の権利帰属は [OpenAI利用規約・Content](https://openai.com/policies/terms-of-use/) に基づきます。これは第三者配布のCC0素材という扱いではありません。

## フォント

| フォント | 出典 | ライセンス・同梱記録 |
| --- | --- | --- |
| Zen Maru Gothic | [google/fonts](https://github.com/google/fonts/tree/main/ofl/zenmarugothic)、`@fontsource/zen-maru-gothic` | [OFL全文](public/licenses/Zen-Maru-Gothic-OFL.txt) |
| Cormorant Garamond | [Cormorant Project](https://github.com/CatharsisFonts/Cormorant)、`@fontsource/cormorant-garamond` | [OFL全文](public/licenses/Cormorant-Garamond-OFL.txt) |

[SIL Open Font License 1.1](https://openfontlicense.org/) の許可に従い、ゲーム内への埋め込みと商用利用が可能です。フォント単体を販売しません。ライセンスと著作権表示は公開ビルドにも同梱します。

日本語フォントは固定UIで使う文字に絞って軽量化し、変更後の名前を **Forest Maru** としています。`public/assets/forest-maru-500.woff2`（約47KB）と `forest-maru-700.woff2`（約48KB）。内部の著作権・ライセンス情報を保持しています。

コピーを追加したら次の手順で再生成します。

1. Google Fonts公式リポジトリの `ofl/zenmarugothic/ZenMaruGothic-Medium.ttf` と `ZenMaruGothic-Bold.ttf` を `art/source/` に保存。
2. `python -m pip install --target .font-build fonttools brotli`
3. `python scripts/subset-fonts.py`

## 音・UI

SEとBGMは `src/audio.ts` のオシレーターと音程列による本作オリジナルの合成音です。外部音源・サンプル・録音素材は使用していません。看板、道、操作アイコン、パーティクルは本作のSVG/CSSで描画しています。

ゲームコード・生成素材の再配布ライセンスはこの記録では新たに設定しません。第三者フォントには、それぞれ同梱のOFLが引き続き適用されます。
