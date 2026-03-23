<template>
  <a-card class="auth-card" :bordered="false">
      <h1 class="login-title">微站</h1>
      <a-form autocomplete="off" layout="vertical" :model="formState" @finish="onFinish">

          <a-form-item name="userAccount"
                       :rules="[
                         { required: true, message: '请输入账号' },
                         { min: 4, message: '账号长度不能小于 4 位' }
                       ]">
            <a-input v-model:value="formState.userAccount" size="large" placeholder="请输入账号" />
          </a-form-item>

          <a-form-item name="userPassword"
                       :rules="[
                         { required: true, message: '请输入密码' },
                         { min: 8, message: '账号长度不能小于 8 位' }
                       ]">
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
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api/loginController'
import { useLoginUserStore } from '@/stores/loginUser'
import { notify } from '@/utils/notify'

/** 登录表单字段类型 */
type LoginFormState = {
  userAccount: string
  userPassword: string
  rememberMe: boolean
}

/** 本地存储中「记住密码」所保存的数据结构 */
type RememberedLogin = {
  userAccount: string
  userPassword: string
  rememberMe: boolean
}

/** localStorage 中保存记住密码信息的键名 */
const REMEMBER_LOGIN_KEY = 'remembered-login-info'

const router = useRouter()
const loginUserStore = useLoginUserStore()
/** 是否正在提交登录，用于按钮 loading 状态 */
const submitting = ref(false)

const formState = reactive<LoginFormState>({
  userAccount: '',
  userPassword: '',
  rememberMe: true,
})

/**
 * 从本地存储读取上次保存的账号、密码及「记住密码」勾选状态，
 * 用于页面进入时自动回填表单。
 */
const loadRememberedLogin = () => {
  const savedLogin = localStorage.getItem(REMEMBER_LOGIN_KEY)
  if (!savedLogin) {
    return
  }

  try {
    const parsedLogin = JSON.parse(savedLogin) as Partial<RememberedLogin>
    formState.userAccount = parsedLogin.userAccount ?? ''
    formState.userPassword = parsedLogin.userPassword ?? ''
    formState.rememberMe = parsedLogin.rememberMe ?? true
  } catch {
    localStorage.removeItem(REMEMBER_LOGIN_KEY)
  }
}

/**
 * 根据「记住密码」勾选情况，将账号密码写入本地存储或清除已保存内容。
 * 仅在登录成功时调用。
 */
const saveRememberedLogin = () => {
  if (!formState.rememberMe) {
    localStorage.removeItem(REMEMBER_LOGIN_KEY)
    return
  }

  const rememberedLogin: RememberedLogin = {
    userAccount: formState.userAccount,
    userPassword: formState.userPassword,
    rememberMe: formState.rememberMe,
  }
  localStorage.setItem(REMEMBER_LOGIN_KEY, JSON.stringify(rememberedLogin))
}

/**
 * 表单提交（登录）：调用登录接口，成功后保存记住密码、更新登录用户并跳转首页。
 */
const onFinish = async () => {
  submitting.value = true
  try {
    const res = await login({
      userAccount: formState.userAccount,
      userPassword: formState.userPassword,
    })
    if (res.data.code === 0 && res.data.data) {
      saveRememberedLogin()
      loginUserStore.setLoginUser(res.data.data)
      notify.success('登录成功')
      await router.push({
        path: '/',
        replace: true
      })
      return
    }
    notify.error(res.data.message || '登录失败，请重试')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '登录失败，请检查网络后重试'
    notify.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

/** 页面挂载后尝试恢复本地记住的账号密码 */
onMounted(() => {
  loadRememberedLogin()
})
</script>

<style scoped>
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

.register-hint {
  margin-top: 4px;
  text-align: center;
  color: #4a5d7a;
}

@media (max-width: 768px) {
  .login-title {
    font-size: 32px;
  }
}
</style>
