const EXAMPLE_CODE = `HStack {
    Image("Whiskers")
        .resizable()
        .aspectRatio(contentMode: .fill)
        .frame(width: 60, height: 60)

    VStack(alignment: .leading) {
        Label("Whiskers", systemImage: "cat.fill")
        Text("Tightrope walking")
    }

    Spacer()
}`;

const TRANSLATIONS = {
  "zh-Hant": {
    headerCopy: "SwiftUI 結構視覺化工具",
    home: "SwiftUI View Hierarchy 首頁",
    generatorRegion: "SwiftUI 階層圖產生器",
    languageControl: "語言",
    heroTitle: "把程式碼，變成",
    heroAccent: "看得懂的階層。",
    heroDescription: "貼上 SwiftUI View 程式碼，即時生成可互動的視覺化結構。點擊節點即可展開或收合子 View。",
    foxAlt: "可愛的北極狐抱著 Swift 標誌",
    loadExample: "載入範例",
    clearCode: "清除程式碼",
    swiftCode: "SwiftUI 程式碼",
    generate: "生成階層圖",
    themeColor: "設定主題顏色",
    themeColorLabel: "主題顏色",
    namesOnly: "只顯示名稱",
    diagramControls: "階層圖控制列",
    zoomOut: "縮小",
    zoomIn: "放大",
    resetZoom: "重設縮放",
    emptyTitle: "等待 SwiftUI 程式碼",
    emptyDescription: "在左側貼上程式後，按下「生成階層圖」",
    containerView: "容器 View",
    leafNode: "葉節點",
    hint: '<span>TIP</span> 點擊帶有 <b>−</b> 的節點，即可收合其所有子 View；開啟「只顯示名稱」可隱藏參數。',
    viewType: "View 型別",
    customView: "自訂 View",
    collapse: "收合",
    expand: "展開"
  },
  en: {
    headerCopy: "SwiftUI structure visualizer",
    home: "SwiftUI View Hierarchy home",
    generatorRegion: "SwiftUI hierarchy generator",
    languageControl: "Language",
    heroTitle: "Turn code into",
    heroAccent: "a visible hierarchy.",
    heroDescription: "Paste SwiftUI View code to instantly generate an interactive structure. Click any container to expand or collapse its child Views.",
    foxAlt: "A cute arctic fox hugging the Swift logo",
    loadExample: "Load example",
    clearCode: "Clear code",
    swiftCode: "SwiftUI code",
    generate: "Generate hierarchy",
    themeColor: "Set theme color",
    themeColorLabel: "Theme color",
    namesOnly: "Names only",
    diagramControls: "Hierarchy controls",
    zoomOut: "Zoom out",
    zoomIn: "Zoom in",
    resetZoom: "Reset zoom",
    emptyTitle: "Waiting for SwiftUI code",
    emptyDescription: "Paste code on the left, then select “Generate hierarchy”",
    containerView: "Container View",
    leafNode: "Leaf node",
    hint: '<span>TIP</span> Select a node with <b>−</b> to collapse its child Views; enable “Names only” to hide parameters.',
    viewType: "View type",
    customView: "Custom View",
    collapse: "Collapse",
    expand: "Expand"
  }
};

let currentLanguage = "en";

function translate(key) {
  return TRANSLATIONS[currentLanguage][key] || key;
}

const codeInput = document.querySelector("#codeInput");
const lineNumbers = document.querySelector("#lineNumbers");
const lineCount = document.querySelector("#lineCount");
const treeStage = document.querySelector("#treeStage");
const emptyState = document.querySelector("#emptyState");
const nodeCount = document.querySelector("#nodeCount");
const depthCount = document.querySelector("#depthCount");
const zoomValue = document.querySelector("#zoomValue");
const nameOnlyToggle = document.querySelector("#nameOnlyToggle");
const treeColorInput = document.querySelector("#treeColorInput");
let zoom = 1;

function mixHex(hex, targetHex, amount) {
  const parse = (value) => [1, 3, 5].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
  const source = parse(hex);
  const target = parse(targetHex);
  return `#${source.map((channel, index) => Math.round(channel + (target[index] - channel) * amount).toString(16).padStart(2, "0")).join("")}`;
}

function applyTreeColor(color, persist = true) {
  const [red, green, blue] = [1, 3, 5].map((index) => Number.parseInt(color.slice(index, index + 2), 16));
  const root = document.documentElement;
  root.style.setProperty("--violet", color);
  root.style.setProperty("--violet-dark", mixHex(color, "#000000", .16));
  root.style.setProperty("--violet-soft", mixHex(color, "#ffffff", .88));
  root.style.setProperty("--accent-light", mixHex(color, "#ffffff", .12));
  root.style.setProperty("--accent-glow", `rgba(${red}, ${green}, ${blue}, .28)`);
  root.style.setProperty("--accent-selection", `rgba(${red}, ${green}, ${blue}, .48)`);
  root.style.setProperty("--accent-ambient", `rgba(${red}, ${green}, ${blue}, .13)`);
  root.style.setProperty("--accent-ambient-soft", `rgba(${red}, ${green}, ${blue}, .08)`);
  root.style.setProperty("--shadow", `0 22px 65px rgba(${red}, ${green}, ${blue}, .12)`);
  root.style.setProperty("--tree-color", color);
  root.style.setProperty("--tree-light", mixHex(color, "#ffffff", .12));
  root.style.setProperty("--tree-highlight", mixHex(color, "#ffffff", .24));
  root.style.setProperty("--tree-deep", mixHex(color, "#000000", .2));
  root.style.setProperty("--tree-dark", mixHex(color, "#000000", .38));
  root.style.setProperty("--tree-component", mixHex(color, "#ffffff", .07));
  root.style.setProperty("--tree-shadow", `rgba(${red}, ${green}, ${blue}, .26)`);
  root.style.setProperty("--tree-line", mixHex(color, "#ffffff", .38));
  if (persist) {
    try { localStorage.setItem("swiftui-hierarchy-color", color); } catch { /* Storage may be unavailable. */ }
  }
}

function tokenizeSwift(source) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) { i += 1; continue; }
    if (c === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    if (c === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < source.length - 1 && !(source[i] === "*" && source[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }
    if (c === '"') {
      let value = c;
      i += 1;
      while (i < source.length) {
        value += source[i];
        if (source[i] === '"' && source[i - 1] !== "\\") { i += 1; break; }
        i += 1;
      }
      tokens.push({ type: "string", value });
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let value = c;
      i += 1;
      while (i < source.length && /[A-Za-z0-9_]/.test(source[i])) value += source[i++];
      tokens.push({ type: "id", value });
      continue;
    }
    tokens.push({ type: "punct", value: c });
    i += 1;
  }
  return tokens;
}

function findClosing(tokens, start, open, close) {
  let depth = 0;
  for (let i = start; i < tokens.length; i += 1) {
    if (tokens[i].value === open) depth += 1;
    if (tokens[i].value === close) depth -= 1;
    if (depth === 0) return i;
  }
  return tokens.length - 1;
}

function summarizeArguments(tokens, start, end) {
  if (start >= end) return "";
  const raw = tokens.slice(start, end).map((token) => token.value).join("")
    .replace(/,/g, ", ")
    .replace(/:/g, ": ");
  return raw.length > 34 ? `${raw.slice(0, 31)}…` : raw;
}

function parseSwiftUI(source) {
  const tokens = tokenizeSwift(source);
  let nextId = 1;

  function parseRange(start, end) {
    const nodes = [];
    let i = start;
    while (i < end) {
      const token = tokens[i];
      const previous = tokens[i - 1]?.value;
      const next = tokens[i + 1]?.value;
      const looksLikeView = token?.type === "id" && /^[A-Z]/.test(token.value) &&
        (next === "(" || next === "{") && !["some", "any", ":", "."].includes(previous);

      if (looksLikeView) {
        const node = { id: nextId++, name: token.value, detail: "", modifiers: [], children: [] };
        let cursor = i + 1;
        if (tokens[cursor]?.value === "(") {
          const close = findClosing(tokens, cursor, "(", ")");
          node.detail = summarizeArguments(tokens, cursor + 1, close);
          cursor = close + 1;
        }

        while (tokens[cursor]?.value === "." && tokens[cursor + 1]?.type === "id") {
          node.modifiers.push(tokens[cursor + 1].value);
          cursor += 2;
          if (tokens[cursor]?.value === "(") cursor = findClosing(tokens, cursor, "(", ")") + 1;
        }

        if (tokens[cursor]?.value === "{") {
          const close = findClosing(tokens, cursor, "{", "}");
          node.children = parseRange(cursor + 1, close);
          cursor = close + 1;
        }
        nodes.push(node);
        i = Math.max(cursor, i + 1);
        continue;
      }

      if (token?.value === "{") {
        const close = findClosing(tokens, i, "{", "}");
        nodes.push(...parseRange(i + 1, close));
        i = close + 1;
        continue;
      }
      i += 1;
    }
    return nodes;
  }

  const viewTypes = [];
  let cursor = 0;
  while (cursor < tokens.length) {
    if (tokens[cursor]?.value !== "struct" || tokens[cursor + 1]?.type !== "id") {
      cursor += 1;
      continue;
    }

    const typeName = tokens[cursor + 1].value;
    let openingBrace = cursor + 2;
    while (openingBrace < tokens.length && tokens[openingBrace].value !== "{") openingBrace += 1;
    if (openingBrace >= tokens.length) break;

    const declaration = tokens.slice(cursor + 2, openingBrace).map((token) => token.value);
    const conformsToView = declaration.includes(":") && declaration.includes("View");
    const closingBrace = findClosing(tokens, openingBrace, "{", "}");

    if (conformsToView) {
      const typeNode = {
        id: nextId++,
        name: typeName,
        detail: "View type",
        kind: "type",
        modifiers: [],
        children: parseRange(openingBrace + 1, closingBrace)
      };
      viewTypes.push(typeNode);
    }
    cursor = closingBrace + 1;
  }

  if (!viewTypes.length) return parseRange(0, tokens.length);

  const definitions = new Map(viewTypes.map((typeNode) => [typeNode.name, typeNode]));
  const referencedTypes = new Set();

  function expandCustomViews(nodes, ancestry) {
    return nodes.map((node) => {
      const definition = definitions.get(node.name);
      const isRecursiveReference = ancestry.has(node.name);

      if (definition) referencedTypes.add(node.name);

      if (definition && !isRecursiveReference) {
        const nextAncestry = new Set(ancestry);
        nextAncestry.add(node.name);
        return {
          ...node,
          id: nextId++,
          kind: "component",
          detail: node.detail || "Custom View",
          children: expandCustomViews(definition.children, nextAncestry)
        };
      }

      return {
        ...node,
        id: nextId++,
        children: expandCustomViews(node.children, ancestry)
      };
    });
  }

  const expandedTypes = viewTypes.map((typeNode) => ({
    ...typeNode,
    children: expandCustomViews(typeNode.children, new Set([typeNode.name]))
  }));
  const entryTypes = expandedTypes.filter((typeNode) => !referencedTypes.has(typeNode.name));

  return entryTypes.length ? entryTypes : expandedTypes.slice(0, 1);
}

function escapeHTML(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function nodeIcon(node) {
  const { name } = node;
  if (node.kind === "type") return "⌘";
  if (node.kind === "component") return "◇";
  if (name.includes("Stack")) return "▤";
  if (name === "Image") return "◇";
  if (name === "Text" || name === "Label") return "T";
  if (name === "Spacer") return "↔";
  return "◈";
}

function renderNode(node) {
  const hasChildren = node.children.length > 0;
  const detailText = node.kind === "type" ? translate("viewType") : node.kind === "component" ? translate("customView") : node.detail;
  const detail = detailText ? `<span class="node-detail">${escapeHTML(detailText)}</span>` : "";
  const children = hasChildren ? `<ul>${node.children.map(renderNode).join("")}</ul>` : "";
  return `<li data-node-id="${node.id}">
    <div class="node-row">
      <button class="view-node ${hasChildren ? "has-children" : ""} ${node.kind === "type" ? "type-node" : ""} ${node.kind === "component" ? "component-node" : ""}" type="button" ${hasChildren ? `aria-expanded="true" aria-label="${translate("collapse")} ${escapeHTML(node.name)}"` : "disabled"}>
        <span class="node-icon">${nodeIcon(node)}</span>
        <span class="node-text"><span class="node-name">${escapeHTML(node.name)}</span>${detail}</span>
        ${hasChildren ? '<span class="toggle">−</span>' : ""}
      </button>
    </div>${children}
  </li>`;
}

function treeStats(nodes) {
  let count = 0;
  let maxDepth = 0;
  function visit(list, depth) {
    if (!list.length) return;
    maxDepth = Math.max(maxDepth, depth);
    list.forEach((node) => { count += 1; visit(node.children, depth + 1); });
  }
  if (nodes.length) visit(nodes, 1);
  return { count, maxDepth };
}

function renderTree() {
  const nodes = parseSwiftUI(codeInput.value);
  const stats = treeStats(nodes);
  treeStage.classList.toggle("names-only", nameOnlyToggle.checked);
  emptyState.hidden = nodes.length > 0;
  treeStage.innerHTML = nodes.length ? `<ul class="tree">${nodes.map(renderNode).join("")}</ul>` : "";
  nodeCount.textContent = currentLanguage === "en" ? `${stats.count} ${stats.count === 1 ? "View" : "Views"}` : `${stats.count} 個 View`;
  depthCount.textContent = currentLanguage === "en" ? `${stats.maxDepth} ${stats.maxDepth === 1 ? "Level" : "Levels"}` : `${stats.maxDepth} 層`;
  setZoom(1);
}

function updateEditorMeta() {
  const count = codeInput.value.split("\n").length;
  lineNumbers.innerHTML = Array.from({ length: count }, (_, index) => index + 1).join("<br>");
  lineCount.textContent = currentLanguage === "en" ? `${count} ${count === 1 ? "line" : "lines"}` : `${count} 行`;
  lineNumbers.scrollTop = codeInput.scrollTop;
}

function setZoom(next) {
  zoom = Math.min(1.5, Math.max(.6, Math.round(next * 10) / 10));
  treeStage.style.transform = `scale(${zoom})`;
  zoomValue.textContent = `${Math.round(zoom * 100)}%`;
}

codeInput.addEventListener("input", updateEditorMeta);
codeInput.addEventListener("scroll", () => { lineNumbers.scrollTop = codeInput.scrollTop; });
codeInput.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    const start = codeInput.selectionStart;
    codeInput.setRangeText("    ", start, codeInput.selectionEnd, "end");
    updateEditorMeta();
  }
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") renderTree();
});

treeStage.addEventListener("click", (event) => {
  const button = event.target.closest(".has-children");
  if (!button) return;
  const item = button.closest("li");
  const collapsed = item.classList.toggle("collapsed");
  button.setAttribute("aria-expanded", String(!collapsed));
  button.setAttribute("aria-label", `${translate(collapsed ? "expand" : "collapse")} ${button.querySelector(".node-name").textContent}`);
  button.querySelector(".toggle").textContent = collapsed ? "+" : "−";
});

document.querySelector("#generateButton").addEventListener("click", renderTree);
document.querySelector("#exampleButton").addEventListener("click", () => { codeInput.value = EXAMPLE_CODE; updateEditorMeta(); renderTree(); });
document.querySelector("#clearButton").addEventListener("click", () => { codeInput.value = ""; updateEditorMeta(); renderTree(); codeInput.focus(); });
document.querySelector("#zoomInButton").addEventListener("click", () => setZoom(zoom + .1));
document.querySelector("#zoomOutButton").addEventListener("click", () => setZoom(zoom - .1));
document.querySelector("#fitButton").addEventListener("click", () => setZoom(1));
nameOnlyToggle.addEventListener("change", () => {
  treeStage.classList.toggle("names-only", nameOnlyToggle.checked);
});
treeColorInput.addEventListener("input", () => applyTreeColor(treeColorInput.value));

function setLanguage(language, persist = true) {
  currentLanguage = TRANSLATIONS[language] ? language : "en";
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    element.innerHTML = translate(element.dataset.i18nHtml);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", translate(element.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.setAttribute("title", translate(element.dataset.i18nTitle));
  });
  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    element.setAttribute("alt", translate(element.dataset.i18nAlt));
  });
  document.querySelectorAll("[data-language]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.language === currentLanguage));
  });
  updateEditorMeta();
  renderTree();
  if (persist) {
    try { localStorage.setItem("swiftui-hierarchy-language", currentLanguage); } catch { /* Storage may be unavailable. */ }
  }
}

document.querySelectorAll("[data-language]").forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

try {
  const savedTreeColor = localStorage.getItem("swiftui-hierarchy-color");
  if (/^#[0-9a-f]{6}$/i.test(savedTreeColor || "")) treeColorInput.value = savedTreeColor;
} catch { /* Use the default color when storage is unavailable. */ }
applyTreeColor(treeColorInput.value, false);

codeInput.value = EXAMPLE_CODE;
let savedLanguage = "en";
try { savedLanguage = localStorage.getItem("swiftui-hierarchy-language") || savedLanguage; } catch { /* Use English. */ }
setLanguage(savedLanguage, false);
