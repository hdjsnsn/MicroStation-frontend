<template>
  <div class="register-page">
    <div class="flow-layer">
      <span class="flow-shape flow-shape-blue-1" />
      <span class="flow-shape flow-shape-blue-2" />
      <span class="flow-shape flow-shape-orange-1" />
      <span class="flow-shape flow-shape-orange-2" />
    </div>
    <a-button class="back-home-btn" type="link" @click="goHome">返回主页</a-button>
    <a-card class="register-card" :bordered="false">
      <h1 class="register-title">注册</h1>
      <a-form layout="vertical" :model="formState" @finish="onFinish">
        <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
          <a-input v-model:value="formState.userAccount" size="large" placeholder="请输入账号" />
        </a-form-item>

        <a-form-item name="userPassword" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="formState.userPassword" size="large" placeholder="请输入密码" />
        </a-form-item>

        <a-form-item name="checkPassword" :rules="[{ required: true, message: '请确认密码' }]">
          <a-input-password v-model:value="formState.checkPassword" size="large" placeholder="请再次输入密码" />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" size="large" block :loading="submitting">
            注 册
          </a-button>
        </a-form-item>
      </a-form>

      <div class="login-hint">
        已有账号?
        <RouterLink to="/user/login" class="link-text">去登录</RouterLink>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { register } from '@/api/loginController'

type RegisterFormState = {
  userAccount: string
  userPassword: string
  checkPassword: string
}

const router = useRouter()
const submitting = ref(false)

const formState = reactive<RegisterFormState>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
})

const onFinish = async () => {
  if (formState.userPassword !== formState.checkPassword) {
    message.error('两次输入的密码不一致')
    return
  }
  submitting.value = true
  try {
    const res = await register({
      userAccount: formState.userAccount,
      userPassword: formState.userPassword,
      checkPassword: formState.checkPassword,
    })
    if (res.data.code === 0) {
      message.success('注册成功，请登录')
      await router.push('/user/login')
      return
    }
    message.error(res.data.message || '注册失败，请重试')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '注册失败，请检查网络后重试'
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
.register-page {
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

.register-card {
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

.register-title {
  text-align: center;
  color: #1a2f55;
  margin: 0 0 24px;
  font-size: 40px;
  font-weight: 700;
}

.link-text {
  color: #3b95d8;
}

.login-hint {
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

:deep(.ant-input-password input::placeholder),
:deep(.ant-input-password input) {
  color: #4a5d7a;
}

@media (max-width: 768px) {
  .register-page {
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

  .register-title {
    font-size: 32px;
  }
}
</style>
