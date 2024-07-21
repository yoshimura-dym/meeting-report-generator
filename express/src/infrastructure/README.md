# WebSpeechAPI クラス

`WebSpeechAPI` クラスは、Web Speech API を使用して音声ファイル（MP3）をテキストに変換するための機能を提供します。このクラスは Puppeteer を使用してブラウザを制御し、Web Speech API を実行します。

## 主な機能

1. ブラウザの初期化
2. MP3 ファイルのテキストへの変換

## インターフェース

```typescript
interface IWebSpeechAPI {
    buildBrowser(): Promise<void>;
    translateMP3toText(filepath: string): Promise<string>;
}