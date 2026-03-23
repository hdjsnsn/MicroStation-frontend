<template>
  <a-card class="auth-card" :bordered="false">
      <h1 class="register-title">注册</h1>
      <a-form layout="vertical" :model="formState" @finish="onFinish">
        <a-form-item name="userAccount"
                     :rules="[
                       { required: true, message: '请输入账号' },
                       { min: 4, message: '长度不能小于 4 位' },
                     ]">
          <a-input v-model:value="formState.userAccount" size="large" placeholder="请输入账号" />
        </a-form-item>

        <a-form-item name="userName" :rules="[{ required: true, message: '请输入昵称' }]">
          <a-input v-model:value="formState.userName" size="large" placeholder="请输入昵称" />
        </a-form-item>

        <a-form-item name="userPassword"
                     :rules="[
                       { required: true, message: '请输入密码' },
                       { min: 8, message: '长度不能小于 8 位' },
                     ]">
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
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/loginController'
import { notify } from '@/utils/notify'

type RegisterFormState = {
  userAccount: string
  userName: string
  userPassword: string
  checkPassword: string
}

const router = useRouter()
const submitting = ref(false)

const formState = reactive<RegisterFormState>({
  userAccount: '',
  userName: '',
  userPassword: '',
  checkPassword: '',
})

const onFinish = async () => {
  if (formState.userPassword !== formState.checkPassword) {
    notify.error('两次输入的密码不一致')
    return
  }
  submitting.value = true
  try {
    const res = await register({
      userAccount: formState.userAccount,
      userName: formState.userName,
      userPassword: formState.userPassword,
      checkPassword: formState.checkPassword,
    })
    if (res.data.code === 0) {
      notify.success('注册成功，请登录')
      await router.push('/user/login')
      return
    }
    notify.error(res.data.message || '注册失败，请重试')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '注册失败，请检查网络后重试'
    notify.error(errorMessage)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.register-title {
  text-align: center;
  color: #1a2f55;
  margin: 0 0 24px;
  font-size: 40px;
  font-weight: 700;
}

.login-hint {
  margin-top: 4px;
  text-align: center;
  color: #4a5d7a;
}

@media (max-width: 768px) {
  .register-title {
    font-size: 32px;
  }
}
</style>
