# 🎮 键盘冒险岛 (Keyboard Adventure)

> 一款专为儿童设计的打字练习 RPG 游戏 —— 把枯燥的键位练习变成一场冒险！

[**在线试玩 →**](https://nick-human0924.github.io/keyboard-adventure/)

---

## 📖 游戏介绍

**键盘冒险岛** 是一款面向 6-10 岁儿童的打字练习游戏。玩家扮演一名勇敢的打字战士，在冒险岛上挑战各种怪物。每正确输入一个字母、单词或句子，就是对怪物的一次攻击！

游戏采用 **8 阶段渐进式难度体系**，从单字母到长句子，让孩子在游戏中自然掌握盲打技能。

---

## 🎯 核心玩法

1. **选择世界** — 5 大世界递进解锁（草地→森林→小镇→海洋→太空）
2. **探索地图** — 横版卷轴移动，捡金币、开宝箱
3. **遭遇怪物** — 碰撞进入战斗
4. **打字战斗** — 限时输入目标文本，正确=攻击，超时/输错=被反击
5. **升级成长** — 获得金币和 XP，解锁装备、商店道具

---

## 🗺️ 5 大世界难度递进

| 世界 | 主题 | 练习内容 | 阶段 |
|------|------|----------|------|
| 🌿 字母草地 | 草地 | 单字母 A-Z | 基准键 → 全字母 |
| 🌲 组合森林 | 森林 | 双字母组合 as/th/er | 相邻键→跨手→对角 |
| 🏘️ 短词小镇 | 小镇 | 2-5 字母单词 cat/dog | CVC 单词 |
| 🌊 海洋世界 | 海洋 | 7-15 字母长单词 | butterfly/chocolate |
| 🚀 太空世界 | 太空 | 短句和长句子 | "the quick brown fox" |

---

## 🛠️ 技术栈

- **前端**: React 19 + TypeScript + Vite
- **样式**: Tailwind CSS + shadcn/ui（40+ 组件）
- **音频**: Web Audio API 实时合成（零外部依赖）
- **存档**: localStorage 本地存储（3 槽位）
- **部署**: GitHub Pages

---

## 🎮 辅助系统

- 🏪 **商店** — 药水、装备、属性加成
- 📜 **每日任务** — 击败怪物、正确率达标、学习新单词
- 📚 **词汇本** — 记录已学和在学单词
- 🐉 **怪物图鉴** — 已击败怪物收集
- 📊 **状态面板** — HP/XP/装备/统计
- ⚔️ **自由挑战** — 字母/组合/单词/句子练习 + 排行榜
- 🛡️ **护盾机制** — 连击 2+ 超时减伤 70%

---

## 🚀 本地运行

```bash
npm install
npm run dev
```

访问 http://localhost:3000

---

## 📝 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.10 | 2026-04-29 | 首次部署，功能完整 |

---

*由 Kimi Agent 开发，OpenClaw 部署维护* 🖤

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
