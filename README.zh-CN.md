# 包装询价清单

这是一个在本地使用的礼盒询价完整性检查。页面在浏览器里用确定性规则解析询价，不是人工智能。把买家的询价贴进来，核对读出的字段，改掉不对的地方。清单可以编辑，再得到一份可以自己发出去的清单。询价内容不会上传。

页面为 [Yoofo Packaging](https://customgiftboxesfactory.com)（Shanghai Yoofo Packaging）制作。工厂询价表在 [customgiftboxesfactory.com/en/quote](https://customgiftboxesfactory.com/en/quote)。本页不会替你打开并提交那张表，也不会发邮件。

## 公开地址

线上演示在 [https://customgiftboxesfactory.com/tools/packaging-rfq-checklist/](https://customgiftboxesfactory.com/tools/packaging-rfq-checklist/)。

2026 年 11 月 17 日（上海，UTC+8）已有人在浏览器里独立核对过该页：中英文界面、修改字段、数量分档、文本和 JSON 下载、窄屏，以及询价链接。1.0.1 是这次核对之后的源码。它修正了磁吸书型盒被收成只剩闭合方式的问题，并在清单日期上写明浏览器本地日历和时区。本仓库不会自行更新那台主机。

托管方式是把 `dist/` 的内容放到现有 Yoofo 网站的该路径。本项目不使用 Vercel，也不会把仓库镜像到 Vercel。发布这份源码不会部署或改动那个网站。

## 仓库

源码仓库是 [https://github.com/felix66cool/yoofo-packaging-rfq-checklist](https://github.com/felix66cool/yoofo-packaging-rfq-checklist)。

```bash
git clone https://github.com/felix66cool/yoofo-packaging-rfq-checklist.git
cd yoofo-packaging-rfq-checklist
```

界面默认是英文。页眉可以切换成中文。生成的清单可以是英文、中文或双语。

## 它做什么

- 在浏览器里用确定性规则解析贴进来的询价，不是人工智能：中文和英文里的关键词、数字格式。
- 把建议和读到的原文放在一起，每一项都可以改。
- 标出礼盒工厂报价前通常需要的内容：盒型结构、带单位且标明内尺寸或外尺寸的尺寸、订单数量、板材。
- 灰板和密度板分开处理。两种都写了的时候，不会选定其中一种。
- 500 / 1,000 / 2,000 是三个数量档，不会加总。
- 起订量只作为起订量，不会当成订单数量。
- 清单可以复制、下载成文本、下载成 JSON，或打印。
- 阅读前会去掉网页标记，贴进来的页面按文字处理。

## 它不做什么

- 不算价格，也没有成本公式。
- 不确认结构能不能做，也不表示盒子可以生产。
- 不推荐板材、结构或供应商。
- 不是语言模型。单位、印刷面或板材没有写出来，字段就保持空白。
- 不把询价发到任何地方。询价页面的链接只是一个链接。
- 不保证据此做出的报价是准确的。
- 不保证地理覆盖、搜索排名，或在生成式搜索里的可见度。

## 隐私

所有内容都留在这个浏览器标签里。

- 没有账号，没有统计，没有跟踪，没有上传。
- 脚本不会调用 `fetch`、网络套接字或本地存储。刷新页面，询价就清除了。
- 下载的文件由浏览器保存在本机。复制使用的是你自己的剪贴板。
- 构建后的页面带有内容安全策略，禁止连接（`connect-src 'none'`）。
- 外部链接要你自己点开，并使用 `rel="noreferrer"`。
- 只有勾选之后，JSON 才会带上贴进来的原文。默认不勾选。

贴进来的 HTML 不会被当作页面渲染。标签会被去掉，`script` 和 `style` 里的内容会丢弃，剩下的以文字显示。

## 阅读是怎么做的

阅读是浏览器本地的确定性规则解析，不是人工智能，也不是语言模型。同一段文字每次得到的建议都相同。询价内容不会上传。

它查找盒型（磁吸、抽屉、天地盖、书型，以及源码里的其他开合方式）、`120 x 90 x 80 mm` 或 `200×150×60毫米` 这样的三维尺寸、数量说法、板材、印刷、工艺、内托、产品尺寸、设计稿、贸易条款、目的地，以及写明的日期或交期。

它不会替你做的决定：

- 不假定单位。`10 x 8 x 3` 不会被填成毫米、厘米或英寸。
- 只有原文写了内尺寸或外尺寸才会标注。
- 外箱尺寸单独保存，不会当成礼盒尺寸。
- `1000+2000` 是两个数量档，不是 3000。原文里的“总数”只会记一笔，不会用加法去核对。
- 灰板、greyboard、chipboard、灰板是一类。MDF、density board、密度板是另一类。两者不会合并。
- 厚度按原文保留（`2 mm` 或 `1200 gsm`），不会互相换算。
- 磁吸是闭合方式。书型、抽屉、天地盖是盒型结构。“磁吸书型”两者都保留。“抽屉或磁吸”仍是二选一。
- FOB 上海是贸易条款和条款地点。上海不会被填成目的地。
- 清单上的日期是浏览器本地日历，并写明时区。不用 `toISOString` 的 UTC 日期。
- `45 days` 这样的交期不会被换算成日历日期。

建议只是起点。清单根据你改过之后的字段生成。

## 示例

页面里有标注过的示例，是为演示写的，不是客户询价。加载时页面会写明这一点。

## 在本地运行

需要 Node.js 22 或更新版本。

```bash
git clone https://github.com/felix66cool/yoofo-packaging-rfq-checklist.git
cd yoofo-packaging-rfq-checklist
npm ci
npm test
npm run dev
```

打开 [http://127.0.0.1:4317](http://127.0.0.1:4317)。不需要 API 密钥或账号。

## 测试

```bash
npm test
```

测试覆盖简体中文和英文、毫米 / 厘米 / 英寸以及缺失的单位、内尺寸和外尺寸同时出现、密度板和灰板（含密度板、灰板纸、chipboard、density board）、不能相加的多个数量档、与订单分开的起订量，以及不能残留标签的网页标记。另有一项源码检查，确认应用代码里没有网络请求、本地存储，也没有声称使用语言模型。

`npm run build` 会先运行 `tsc`。也可以单独执行 `npx tsc --noEmit`。

## 构建

```bash
npm run build
```

结果在 `dist/`。资源地址是相对的（`vite.config.ts` 里的 `base: './'`），因此同一份文件可以直接放在 `/tools/packaging-rfq-checklist/`，不必改 base。

不需要主机或令牌就可以预览构建结果：

```bash
npm run preview
```

它会在 [http://127.0.0.1:4317](http://127.0.0.1:4317) 提供 `dist/`。

## 把 `dist/` 放到 Yoofo 网站

1. 运行 `npm test` 和 `npm run build`。
2. 把 `dist/` **里面的文件**（包括 `.nojekyll`）上传到现有主机的 `/tools/packaging-rfq-checklist/`。
3. `base` 保持 `./`。改成绝对路径会让这个子目录里的资源失效。

构建和预览都不需要令牌。`.github/workflows/check.yml` 在推送时运行测试和构建，不会发布网站。

## 可选的 GitHub Pages

`.github/workflows/pages.yml` 可以把 `dist/` 发布到 GitHub Pages，而且只有有人手动启动时才会运行，推送不会触发它。GitHub 分配的地址不是上面的线上演示。启动之前需要在仓库设置里打开 Pages。源码仓库是 [https://github.com/felix66cool/yoofo-packaging-rfq-checklist](https://github.com/felix66cool/yoofo-packaging-rfq-checklist)。手动启动该流程是可选的，不属于发布这份源码，也不会改动线上演示。

## 目录

| 路径 | 作用 |
| --- | --- |
| `src/extract.ts` | 阅读询价的规则 |
| `src/assess.ts` | 缺失、含糊和建议补充的项目 |
| `src/export.ts` | 文本清单和 JSON |
| `src/i18n.ts` | 英文和中文文案 |
| `src/ui.ts` | 页面 |
| `src/fixtures.ts` | 标注过的合成示例 |
| `tests/` | 阅读、清单和源码检查 |

## JSON

下载文件的 schema 是 `yoofo-packaging-rfq-checklist/v1`。订单数量、起订量和样品是分开的数组。`quantitiesAreCumulative` 为 `false`。没有总数字段。`reader.usesLanguageModel` 为 `false`。

## 参与修改

见 [CONTRIBUTING.md](CONTRIBUTING.md)。改阅读规则时请补测试，不要贴真实客户的询价。

## 许可

[MIT](LICENSE)。Copyright (c) 2026 Shanghai Yoofo Packaging。

## 局限

- 不常见的说法会漏掉。字段会留空，而不是猜一个值。
- 小于 10 的整数数量不会被读出。需要的话请自己填。
- 只有源码里的英文和简体中文模式会被识别。其他语言仅在出现这些词时才会被读到。
- 超过 100,000 个字符的文字会被拒绝。
- 国家是一份固定名单，不是地名库。不认识的地点会留空，等你填写。
- 工具看不到附件。“设计稿已有”只代表文字是这么写的。
- 即使清单填满了，它仍然不是报价，也不是可以生产的确认。
- 清单不保证据此做出的报价是准确的。
- 清单不保证地理覆盖、搜索排名，或在生成式搜索里的可见度。
