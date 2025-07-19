---
layout: blank
title: Threejs 3D Demo
---

{% assign demo_pages = site.pages | where_exp: "p", "p.path contains 'quickdemo/'" %}

<div class="p-8 bg-gradient-to-b from-neutral-100 to-white min-h-screen">
  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

{% for item in demo_pages %}
<a href="{{ item.url }}">
  <div class="bg-gradient-to-br from-white via-gray-50 to-gray-200 border border-gray-300 rounded-2xl shadow-md overflow-hidden group hover:shadow-xl transition-transform hover:scale-[1.02] duration-300 relative">

  <!-- Image Cover -->
  <div class="relative">
    <img src="{{ item.pic }}" alt="{{ item.title }}"
      class="w-full h-48 object-cover brightness-95 group-hover:brightness-100 transition duration-300" />
    <div class="absolute inset-0 bg-white/40 group-hover:bg-white/20 transition duration-300"></div>
  </div>

  <!-- Content -->
  <div class="p-5 space-y-3">
    <h2 class="text-xl font-semibold text-gray-800 tracking-wide">{{ item.title }}</h2>
    <p class="text-sm text-gray-600">{{ item.description }}</p>
    <button class="mt-3 inline-block px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition">
      Enter
    </button>
  </div>
</div>
</a>
{% endfor %}

  </div>
</div>
