<template>
  <div class="password-verification-page">
    <PasswordAuth
      @success="handleSuccess"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePasswordAuth } from '@/composables/usePasswordAuth.js';
import PasswordAuth from '@/components/ui/PasswordAuth.vue';

const route = useRoute();
const router = useRouter();
const { verifyPassword } = usePasswordAuth();

// 获取重定向路径
const redirectPath = route.query.redirect || '/';

onMounted(() => {
  // 检查是否已经验证过
  const isAuthenticated = localStorage.getItem('cms_authenticated') === 'true';
  if (isAuthenticated) {
    router.replace(redirectPath);
  }
});

// 处理验证成功
const handleSuccess = () => {
  router.replace(redirectPath);
};

// 处理取消/退出
const handleCancel = () => {
  router.replace('/');
};
</script>

<style lang="scss" scoped>
.password-verification-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
</style>
