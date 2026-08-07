# 楽譜工房

五線譜、ピアノ大譜表、TAB譜、コード譜、ダイアグラム、指板図、鍵盤図をカスタマイズし、印刷またはPDF保存できる静的Webアプリです。

## 主な機能

- A4・B5・Letter、たて・よこの用紙設定
- 五線譜、ピアノ大譜表、五線譜＋TAB譜
- 4〜7弦TAB譜、ギター／ベース用ダイアグラム・指板図
- 1列／2列のコード譜、横長／2列の鍵盤図
- タイトル・日付・小節線・線間隔・線の濃さの調整
- お気に入り保存、印刷、ベクターPDF保存

設定とお気に入りは利用中のブラウザ内にだけ保存されます。外部サーバーへの送信やアクセス解析は行いません。

## ローカルで開く

`index.html` を直接開くか、このディレクトリで静的HTTPサーバーを起動します。

```sh
python3 -m http.server 8765
```

その後、`http://localhost:8765/` を開きます。

## 検証

```sh
npm test
```

構文、描画条件、PDF構造、保存データ保護、公開メタ情報とアイコン参照をまとめて検証します。

公開用ファイルだけを `_site/` に生成する場合：

```sh
npm run build
```

## GitHub Pages

公開URL：<https://amashimacreate.github.io/gakufu-kobo/>

`main` ブランチへpushすると、`.github/workflows/pages.yml` が自動で全テストを実行し、検証済みの `_site/` だけをGitHub Pagesへ公開します。

リンク共有用の1200×630px画像、canonical、Open Graph、Xカード、構造化データ、sitemapも上記URLで設定済みです。

GitHub Pagesでは任意のHTTPセキュリティヘッダーを設定できないため、独自ヘッダーが必要になった場合は別のホスティング先を使用してください。

`Leland.otf` は SIL Open Font License のフォント資産です。ライセンス本文は `OFL-Leland.txt` に同梱しています。
