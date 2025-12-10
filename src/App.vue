<template>
  <el-config-provider>
    <div id="app" class="app-container">
      <!-- Header -->
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            <el-icon><Headset /></el-icon>
            Intelligent Music Map
          </h1>
          <div class="header-actions">
            <el-tag type="success" effect="plain" size="large">
              <el-icon><Cpu /></el-icon>
              Local AI (Transformers.js)
            </el-tag>
          </div>
        </div>
      </el-header>

      <!-- Main Content -->
      <el-main class="app-main">
        <router-view />
      </el-main>

      <!-- Footer -->
      <el-footer class="app-footer">
        <p>&copy; 2024 Intelligent Music Map - AI Music Education powered by @huggingface/transformers</p>
      </el-footer>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ElConfigProvider, ElHeader, ElMain, ElFooter, ElIcon, ElTag } from 'element-plus'
import { Headset, Cpu } from '@element-plus/icons-vue'
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 70px;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  font-size: 24px;
  font-weight: 600;
  color: #667eea;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-title .el-icon {
  font-size: 28px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions .el-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.app-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.app-footer {
  background: rgba(255, 255, 255, 0.9);
  text-align: center;
  padding: 16px;
  color: #666;
  font-size: 14px;
  height: 50px;
}

.app-footer p {
  margin: 0;
}
</style>
