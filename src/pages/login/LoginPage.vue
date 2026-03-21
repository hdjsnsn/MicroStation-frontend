<template>
  <div class="login-page" @click="createParticles">
    <div class="flow-layer">
      <span class="flow-shape flow-shape-blue-1" />
      <span class="flow-shape flow-shape-blue-2" />
      <span class="flow-shape flow-shape-orange-1" />
      <span class="flow-shape flow-shape-orange-2" />
    </div>
    <a-button class="back-home-btn" type="link" @click="goHome">返回主页</a-button>
    <a-card class="login-card" :bordered="false">
      <h1 class="login-title">微站</h1>
      <a-form layout="vertical" :model="formState" @finish="onFinish">
        <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
          <a-input v-model:value="formState.userAccount" size="large" placeholder="请输入账号" />
        </a-form-item>

        <a-form-item name="userPassword" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="formState.userPassword" size="large" placeholder="请输入密码" />
        </a-form-item>

        <div class="login-extra">
          <a-checkbox v-model:checked="formState.rememberMe">记住密码</a-checkbox>
          <a class="link-text" href="/">忘记密码?</a>
        </div>

        <a-form-item>
          <a-button type="primary" html-type="submit" size="large" block :loading="submitting">
            登录
          </a-button>
        </a-form-item>
      </a-form>

      <div class="register-hint">
        没有账号?
        <RouterLink to="/user/register" class="link-text">注册</RouterLink>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { login } from '@/api/loginController'
import { useLoginUserStore } from '@/stores/loginUser'

type LoginFormState = {
  userAccount: string
  userPassword: string
  rememberMe: boolean
}

const router = useRouter()
const loginUserStore = useLoginUserStore()
const submitting = ref(false)

const formState = reactive<LoginFormState>({
  userAccount: '',
  userPassword: '',
  rememberMe: true,
})

const onFinish = async () => {
  submitting.value = true
  try {
    const res = await login({
      userAccount: formState.userAccount,
      userPassword: formState.userPassword,
    })
    if (res.data.code === 0 && res.data.data) {
      loginUserStore.setLoginUser(res.data.data)
      message.success('登录成功')
      await router.push('/')
      return
    }
    message.error(res.data.message || '登录失败，请重试')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '登录失败，请检查网络后重试'
    message.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

const goHome = async () => {
  await router.push('/')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  position: relative;
  overflow: hidden;
  background: #f5f7fb;
}

.flow-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.flow-shape {
  position: absolute;
  opacity: 0.45;
  will-change: transform, opacity;
}

.flow-shape-blue-1 {
  width: 46vw;
  height: 14vw;
  min-width: 260px;
  min-height: 86px;
  top: 8%;
  left: -55%;
  background: linear-gradient(90deg, rgba(167, 197, 235, 0.1), rgba(167, 197, 235, 0.45));
  clip-path: polygon(0 70%, 50% 44%, 100% 0, 75% 66%, 18% 88%);
  animation: flowAcrossA 10.5s linear infinite;
}

.flow-shape-blue-2 {
  width: 40vw;
  height: 12vw;
  min-width: 220px;
  min-height: 72px;
  top: 18%;
  left: -48%;
  background: linear-gradient(100deg, rgba(174, 210, 255, 0.08), rgba(174, 210, 255, 0.35));
  clip-path: polygon(0 74%, 42% 54%, 100% 8%, 63% 78%, 12% 90%);
  animation: flowAcrossB 13s linear infinite;
}

.flow-shape-orange-1 {
  width: 54vw;
  height: 18vw;
  min-width: 300px;
  min-height: 110px;
  bottom: 16%;
  right: -62%;
  background: linear-gradient(260deg, rgba(230, 156, 90, 0.06), rgba(226, 134, 57, 0.42));
  clip-path: polygon(0 52%, 36% 20%, 56% 44%, 100% 94%, 42% 56%);
  animation: flowAcrossC 11.5s linear infinite;
}

.flow-shape-orange-2 {
  width: 46vw;
  height: 16vw;
  min-width: 260px;
  min-height: 96px;
  bottom: 10%;
  right: -52%;
  background: linear-gradient(250deg, rgba(223, 175, 117, 0.08), rgba(223, 175, 117, 0.35));
  clip-path: polygon(0 66%, 30% 36%, 68% 28%, 100% 70%, 44% 78%);
  animation: flowAcrossD 14.5s linear infinite;
}

.back-home-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 2;
  color: #1f56a8;
  font-weight: 600;
}

.login-card {
  width: 100%;
  max-width: 420px;
  z-index: 1;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(209, 220, 237, 0.95);
  backdrop-filter: blur(6px);
  box-shadow: 0 14px 36px rgba(31, 86, 168, 0.18);
}

@keyframes flowAcrossA {
  0% {
    transform: translateX(0) translateY(0);
    opacity: 0;
  }
  12% {
    opacity: 0.44;
  }
  100% {
    transform: translateX(178vw) translateY(-1.4vh);
    opacity: 0;
  }
}

@keyframes flowAcrossB {
  0% {
    transform: translateX(0) translateY(0);
    opacity: 0;
  }
  15% {
    opacity: 0.34;
  }
  100% {
    transform: translateX(172vw) translateY(1.2vh);
    opacity: 0;
  }
}

@keyframes flowAcrossC {
  0% {
    transform: translateX(0) translateY(0);
    opacity: 0;
  }
  14% {
    opacity: 0.4;
  }
  100% {
    transform: translateX(-182vw) translateY(-1.6vh);
    opacity: 0;
  }
}

@keyframes flowAcrossD {
  0% {
    transform: translateX(0) translateY(0);
    opacity: 0;
  }
  16% {
    opacity: 0.3;
  }
  100% {
    transform: translateX(-168vw) translateY(1vh);
    opacity: 0;
  }
}

:deep(.ant-card-body) {
  padding: 32px;
}

.login-title {
  text-align: center;
  color: #1a2f55;
  margin: 0 0 24px;
  font-size: 40px;
  font-weight: 700;
}

.login-extra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  color: #4a5d7a;
}

.link-text {
  color: #3b95d8;
}

.register-hint {
  margin-top: 4px;
  text-align: center;
  color: #4a5d7a;
}

:deep(.ant-input),
:deep(.ant-input-password),
:deep(.ant-input-affix-wrapper) {
  background: rgba(255, 255, 255, 0.96);
  color: #22385f;
  border-color: #cdd9ea;
}

:deep(.ant-input::placeholder) {
  color: #9aaac0;
}

:deep(.ant-checkbox-wrapper),
:deep(.ant-form-item-label > label),
:deep(.ant-input-password input::placeholder),
:deep(.ant-input-password input) {
  color: #4a5d7a;
}

@media (max-width: 768px) {
  .login-page {
    min-height: 100vh;
    padding: 16px;
  }

  .back-home-btn {
    top: 12px;
    left: 12px;
  }

  :deep(.ant-card-body) {
    padding: 24px;
  }

  .login-title {
    font-size: 32px;
  }
}
</style>
