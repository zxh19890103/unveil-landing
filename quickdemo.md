---
layout: nonav
---

<div style="width: fit-content; margin: 0 auto;">

{% assign demo_pages = site.pages | where_exp: "p", "p.path contains 'quickdemo/'" %}

{% for page in demo_pages %}

<div  style="margin: 2em 0">
  <a href="{{page.url}}">{{page.title}}</a>
</div>

{% endfor %}

</div>
