# IITC-Plugin

用于 Recon 规划流程的 IITC 用户脚本集合。

## 内容

1. `recon-planner.user.js`（界面名称：**Recon Planner**）
2. `Recon-Range.user.js`（界面名称：**Recon Range**）

## 运行要求

- IITC-CE 运行在以下地址：
  - `https://intel.ingress.com/*`
  - `https://intel-x.ingress.com/*`（`Recon-Range.user.js` 需要）
- 一个用户脚本管理器（Tampermonkey / Violentmonkey / Greasemonkey）
- 可选：IITC Draw Tools 插件（`Recon-Range.user.js` 用于绘制标记圈）

## 安装

1. 打开用户脚本管理器面板。
2. 新建脚本。
3. 复制本仓库中的目标脚本并粘贴。
4. 保存后刷新 IITC 页面。

## 插件：Recon Planner（`recon-planner.user.js`）

### 功能说明

- 从可配置的 `scriptURL` 加载候选点。
- 按状态分层绘制标记。
- 支持创建、编辑（含拖拽）和删除候选点。
- 支持显示：
  - 标题标签
  - 20 米提交半径
  - 40 米交互半径
  - 投票邻近 S2 网格
- 支持按状态自定义颜色/半径开关，以及地图视觉样式。

### 数据接口约定

`GET scriptURL` 应返回候选点 JSON 数组。

示例对象：

```json
{
  "id": "abc123",
  "title": "Portal Name",
  "description": "Optional text",
  "lat": 31.2304,
  "lng": 121.4737,
  "status": "potential",
  "nickname": "agent",
  "submitteddate": "2026-03-03",
  "candidateimageurl": "https://.../photo"
}
```

`POST scriptURL` 接收弹窗表单数据：

- 新建/更新：完整表单
- 删除：`status=delete` 且 `id=<candidate_id>`

后端在新建/更新时应返回保存后的候选点 JSON。

### 本地存储

- 当前设置键：`recon_planner_settings`
- 兼容读取旧键：`wayfarer_planner_settings`

## 插件：Recon Range（`Recon-Range.user.js`）

### 功能说明

- 新增一个可开关的 IITC 图层：`Recon Range`。
- 在可见 Portal 周围绘制仅描边的 20 米圆。
- 与 Draw Tools 标记联动，在以下场景自动同步圆：
  - 新建
  - 拖拽/编辑
  - 删除/清空/导入/吸附
- 缩放低于 16 级时自动隐藏圆。

## 说明

- 两个脚本都依赖 IITC 内部 API 和 DOM 结构；IITC 变更后可能需要同步调整。
- 如果图层项存在但地图不显示内容，请先检查缩放级别和图层开关状态。

