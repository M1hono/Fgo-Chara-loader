<template>
  <div class="theme-container">
    <header class="navbar">
      <div class="navbar-content">
        <a class="title" href="/">FGO Character Viewer</a>
      </div>
    </header>
    <main class="content">
      <Content />
    </main>
    <footer class="footer">
      <p>&copy; 2024 FGO Character Viewer</p>
    </footer>
  </div>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import { Content } from 'vitepress/client'
</script>

<style>
.theme-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  background-color: #1e1e1e;
  padding: 1rem;
}

.navbar-content {
  max-width: 1400px;
  margin: 0 auto;
}

.title {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
}

.content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.footer {
  background-color: #f0f0f0;
  padding: 1rem;
  text-align: center;
}

/* 确保组件内容不会溢出 */
.content > div {
  max-width: 100%;
  overflow-x: hidden;
}

@media (max-width: 1440px) {
  .content {
    padding: 1rem;
  }
}

/* 移除一些可能导致问题的样式 */
body, html {
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
}
</style>
