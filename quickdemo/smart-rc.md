---
layout: quickdemo
title: Simplify React Usage
pic: "./smart-rc/logo.svg"
ico: "logo.svg"
description: "Make React Simple"
---

```tsx
const Page = () => {
  const data = useData({
    // age: 18,
  });

  const { age } = data;

  return (
    <div>
      <div>{age}</div>
      <button
        onClick={() => {
          data.age += 1;
        }}
      >
        +1
      </button>
    </div>
  );
};
```
