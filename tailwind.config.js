module.exports = {
  content: [
    "./_drafts/**/*.html",
    "./_includes/*.html",
    "./_layouts/*.html",
    "./_posts/*.md",
    "./_quickdemo/*.md",
    "./_quickdemo/**/*.tsx",
    "./*.md",
    "./*.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        kiddy: ['"Fredoka"', "ui-sans-serif", "system-ui"],
      },
      colors: {
        primary: "#7B5EFF", // 主色，帶點可愛的紫
        background: "#F9F9FC", // 清爽背景
        accent: "#FF92C2", // 點綴粉色
        text: "#333",
      },
    },
  },
  plugins: [],
};
