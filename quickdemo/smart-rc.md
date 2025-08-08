---
layout: quickdemo
title: Nations Military March
pic: "./military/data/tank.png"
description: "Nations Military March"
---

```tsx
const Page = () => {
  const data = useData({
    age: 18,
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
