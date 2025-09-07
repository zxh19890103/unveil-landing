---
title: Unveil - 用簡易動畫說明複雜內容
layout: landing
location: /quickdemo/harbor3d/
---

<section class="flex flex-col-reverse md:flex-row items-center max-w-6xl mx-auto py-20 gap-10">
  <!-- 文字 -->
  <div class="flex-1 max-w-xl text-center md:text-left">
    <h1 class="text-5xl font-extrabold leading-tight text-indigo-700 fade-in fade-in-delay-1">
      用簡易動畫<br />
      讓複雜內容<br />
      輕鬆被理解
    </h1>
    <p class="mt-6 text-gray-600 text-lg leading-relaxed fade-in fade-in-delay-2">
      一段複雜難懂的文字<br />
      透過簡潔的動畫漸顯、轉換與說明<br />
      讓你的腦袋更自在、更輕鬆。
    </p>
    <button
      class="mt-10 px-8 py-3 rounded-full bg-indigo-600 text-white font-semibold shadow-lg hover:bg-indigo-700 transition fade-in fade-in-delay-3"
      onclick="document.getElementById('demo').scrollIntoView({behavior:'smooth'})"
    >
      立即觀看示例動畫 →
    </button>
  </div>

  <!-- 動畫預留區 -->
  <div
    class="flex-1 max-w-md w-full bg-white rounded-xl shadow-lg p-8 flex items-center justify-center fade-in fade-in-delay-3"
    style="min-height:320px"
  >
    <svg
      class="w-48 h-48 text-indigo-300 animate-bounce"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 64 64"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="32" cy="32" r="30" stroke-opacity="0.2" />
      <path d="M20 32l12 12 12-24" />
    </svg>
  </div>
</section>

<section id="demo" class="max-w-5xl mx-auto px-6 py-20 bg-indigo-50 rounded-xl my-12">
  <h2 class="text-3xl font-bold text-indigo-700 mb-8 text-center">動畫示例演示</h2>

  <div class="grid md:grid-cols-2 gap-12">
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-xl font-semibold text-indigo-600 mb-3">公式逐步展開</h3>
      <p class="text-gray-600 mb-6">
        透過動畫，公式中的每一步被逐漸解析，讓抽象符號變得直觀。
      </p>
      <div class="aspect-w-16 aspect-h-9 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-400 font-mono text-lg select-none">
        [動畫 A 預留區]
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-xl font-semibold text-indigo-600 mb-3">流程圖簡化</h3>
      <p class="text-gray-600 mb-6">
        抽象流程動畫化呈現，拆解步驟與關聯，降低認知負擔。
      </p>
      <div class="aspect-w-16 aspect-h-9 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-400 font-mono text-lg select-none">
        [動畫 B 預留區]
      </div>
    </div>
  </div>
</section>

<section class="bg-white py-16" id="use-cases">
  <div class="max-w-7xl mx-auto px-4 text-center">
    <h2 class="text-4xl font-bold text-gray-800 mb-4 font-fredoka">我們能幫你什麼？</h2>
    <p class="text-lg text-gray-500 mb-12">Unveil 為創作者、學生、工程師帶來新一代圖形內容展示能力</p>
    <div class="grid md:grid-cols-3 gap-8 text-left">
      <!-- Use Case 1 -->
      <div class="bg-blue-50 p-6 rounded-2xl shadow hover:shadow-lg transition duration-300">
        <h3 class="text-xl font-semibold text-blue-800 font-fredoka mb-2">🧑‍🏫 教學內容互動展示</h3>
        <p class="text-gray-600">讓教學動畫動起來，嵌入課程、簡報或網頁，提升學生理解與興趣。</p>
      </div>
      <!-- Use Case 2 -->
      <div class="bg-pink-50 p-6 rounded-2xl shadow hover:shadow-lg transition duration-300">
        <h3 class="text-xl font-semibold text-pink-800 font-fredoka mb-2">🎨 設計與動畫展示</h3>
        <p class="text-gray-600">靈活嵌入你的 UI/UX 原型動畫、插畫故事，吸引用戶的每一秒注意力。</p>
      </div>
      <!-- Use Case 3 -->
      <div class="bg-yellow-50 p-6 rounded-2xl shadow hover:shadow-lg transition duration-300">
        <h3 class="text-xl font-semibold text-yellow-700 font-fredoka mb-2">⚙️ 工程開發與原型</h3>
        <p class="text-gray-600">把 Three.js/WebGL 演示直接嵌入文檔或部落格，一鍵開啟互動體驗。</p>
      </div>
    </div>
  </div>
</section>

<section id="features" class="max-w-5xl mx-auto px-6 py-20">
  <h2 class="text-3xl font-bold text-indigo-700 mb-10 text-center">Unveil 的特點</h2>
  <ul class="space-y-6 max-w-3xl mx-auto text-gray-700 text-lg">
    <li class="flex gap-4 items-center">
      <div class="bg-indigo-200 text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center font-bold select-none">🎨</div>
      <span>文字轉動畫，輕鬆讓難懂概念變得易懂。</span>
    </li>
    <li class="flex gap-4 items-center">
      <div class="bg-indigo-200 text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center font-bold select-none">⚙️</div>
      <span>模組化動畫腳本，方便擴展和自訂。</span>
    </li>
    <li class="flex gap-4 items-center">
      <div class="bg-indigo-200 text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center font-bold select-none">💡</div>
      <span>支援 Markdown 結合動畫描述，簡單上手。</span>
    </li>
    <li class="flex gap-4 items-center">
      <div class="bg-indigo-200 text-indigo-700 rounded-full w-10 h-10 flex items-center justify-center font-bold select-none">🌈</div>
      <span>乾淨舒適的界面，專注內容和動畫表現。</span>
    </li>
  </ul>
</section>

<section id="contact" class="max-w-5xl mx-auto px-6 py-20 text-center">
  <h2 class="text-3xl font-bold text-indigo-700 mb-6">想試試嗎？</h2>
  <p class="max-w-xl mx-auto mb-8 text-gray-600 text-lg">
    傳送你覺得難懂的文字，Unveil 幫你用動畫拆解，輕鬆呈現複雜知識。
  </p>
  <button
    class="px-12 py-3 bg-indigo-600 rounded-full text-white text-lg font-semibold shadow hover:bg-indigo-700 transition"
    onclick="alert('敬請期待！')"
  >
    立即提交你的文字
  </button>
</section>
