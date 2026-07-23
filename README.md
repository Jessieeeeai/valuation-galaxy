# 估值星系 · Valuation Galaxy

美股估值可视化：每家公司是一颗 3D 五角星，五个角 = 五个估值维度（绝对估值 / 历史分位 / 同行相对 / 质量反向 / 行业周期），越长越贵；胖瘦和海拔 = 加权估值温度；光晕黄绿=洼地、黄红=泡沫。

**在线使用**：https://jessieeeeai.github.io/valuation-galaxy/

## 数据
- 基本面：SEC EDGAR 官方 XBRL（companyfacts），由 GitHub Actions 每天 06:23 UTC 自动抓取 92 家公司，裁剪后存入 `data/facts/`
- 价格：免费 FMP API key（在页面 ⚙ 行情设置 里粘贴）或手动输入
- 宏观：静态快照（标注日期）

## 结构
- `index.html` — 完整单文件应用（Three.js 星系 + 估值引擎 + 下钻面板）
- `scripts/fetch_edgar.mjs` — EDGAR 抓取器（Actions 里跑）
- `scripts/universe.json` — 92 家公司宇宙（ticker/名称/星座/CIK）
- `data/facts/<TICKER>.json` — 裁剪后的 companyfacts
- `data/manifest.json` — 最近一次抓取的清单
