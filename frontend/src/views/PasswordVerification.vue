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
import PasswordAuth from '@/components/ui/PasswordAuth.vue';

const route = useRoute();
const router = useRouter();
const redirectPath = route.query.redirect || '/';

onMounted(() => {
  const isAuthenticated = localStorage.getItem('cms_authenticated') === 'true';
  if (isAuthenticated) {
    router.replace(redirectPath);
  }
});

const handleSuccess = () => {
  router.replace(redirectPath);
};

const handleCancel = () => {
  router.replace('/');
};
</script>

<style lang="scss" scoped>
.password-verification-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background:
    radial-gradient(circle at 76% 18%, var(--color-accent-soft), transparent 20rem),
    var(--color-bg);
}
</style>
