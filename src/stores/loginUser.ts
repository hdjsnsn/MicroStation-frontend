import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getLoginUser } from '@/api/loginController.ts'

/**
 * 登录用户信息
 */
export const useLoginUserStore = defineStore('loginUser', () => {

  // 默认值
  const loginUser = ref<API.LoginUserVO>({
    userName: '未登录',
  })

  // 获取登录用户信息
  async function fetchLoginUser(){
    const res = await getLoginUser();
    if (res.data.code === 0 && res.data.data){
      loginUser.value = res.data.data
    }
  }

  // 更新用户信息
  function setLoginUser(newLoginUser:any){
    loginUser.value = newLoginUser;
  }

  /** 登出后清空本地登录态（与未登录默认态一致） */
  function clearLoginUser() {
    loginUser.value = {
      userName: '未登录',
    }
  }

  return { loginUser, fetchLoginUser, setLoginUser, clearLoginUser }
})
