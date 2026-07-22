import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/DemoView.vue'),
    meta: {
      title: 'Specms',
      requiresAuth: false,
      layout: 'default'
    }
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: {
      title: 'Admin Panel',
      requiresAuth: true,
      requiresPassword: true,
      layout: 'admin'
    },
    children: [
      {
        path: 'articles',
        name: 'ArticleList',
        component: () => import('@/views/admin/ArticleList.vue'),
        meta: {
          title: 'Articles | Admin',
          requiresAuth: true,
          requiresPassword: true,
          layout: 'admin'
        }
      },
      {
        path: 'articles/create',
        name: 'ArticleCreate',
        component: () => import('@/views/admin/ArticleCreate.vue'),
        meta: {
          title: 'Create Article | Admin',
          requiresAuth: true,
          requiresPassword: true,
          layout: 'admin'
        }
      },
      {
        path: 'articles/edit/:id',
        name: 'ArticleEdit',
        component: () => import('@/views/admin/ArticleEdit.vue'),
        props: true,
        meta: {
          title: 'Edit Article | Admin',
          requiresAuth: true,
          requiresPassword: true,
          layout: 'admin'
        }
      }
    ]
  },
  {
    path: '/article/:id',
    name: 'ArticleView',
    component: () => import('@/views/ArticleView.vue'),
    props: true,
    meta: {
      title: 'Article | Specms',
      requiresAuth: false,
      layout: 'default'
    }
  },
  {
    path: '/article/:slug',
    name: 'ArticleViewBySlug',
    component: () => import('@/views/ArticleView.vue'),
    props: true,
    meta: {
      title: 'Article | Specms',
      requiresAuth: false,
      layout: 'default'
    }
  },
  {
    path: '/articles',
    name: 'PrivateArticles',
    component: () => import('@/views/PrivateArticles.vue'),
    meta: {
      title: 'Private Articles | Specms',
      requiresAuth: false,
      requiresPassword: true,
      layout: 'default'
    }
  },
  {
    path: '/password-verification',
    name: 'PasswordVerification',
    component: () => import('@/views/PasswordVerification.vue'),
    meta: {
      title: 'Password Verification',
      requiresAuth: false,
      layout: 'minimal'
    }
  },
  {
    path: '/password-settings',
    name: 'PasswordSettings',
    component: () => import('@/views/PasswordSettings.vue'),
    meta: {
      title: 'Password Settings',
      requiresAuth: false,
      requiresPassword: true,
      layout: 'default'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: 'Page Not Found',
      requiresAuth: false,
      layout: 'default'
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Global navigation guards
router.beforeEach((to, from, next) => {
  // Set document title
  document.title = to.meta?.title || 'Specms';
  
  // Check if route requires password verification
  if (to.meta?.requiresPassword) {
    const isAuthenticated = localStorage.getItem('cms_authenticated') === 'true';
    
    if (!isAuthenticated) {
      // Redirect to password verification
      next({
        name: 'PasswordVerification',
        query: { 
          redirect: to.fullPath
        }
      });
      return;
    }
  }
  
  // Check authentication (placeholder - implement actual auth logic)
  if (to.meta?.requiresAuth) {
    // For now, allow all access
    // In a real app, check if user is authenticated
    next();
  } else {
    next();
  }
});

// Scroll behavior
router.afterEach((to, from) => {
  // Only scroll to top if not navigating to the same route
  if (to.path !== from.path) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

export default router;
