import { createRouter, createWebHistory } from 'vue-router'

import HomePage from '@/pages/HomePage.vue'
import LoginPage from '@/pages/login/LoginPage.vue'
import RegisterPage from '@/pages/login/RegisterPage.vue'
import UserManagePage from '@/pages/admin/UserManagePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: '主页',
      component: HomePage,
    },
    {
      path: '/user/login',
      name: '用户登录',
      component: LoginPage,
    },
    {
      path: '/user/register',
      name: '用户注册',
      component: RegisterPage,
    },
    {
      path: '/',
      name: '用户管理',
      component: UserManagePage,
    },
  ],
})

export default router
