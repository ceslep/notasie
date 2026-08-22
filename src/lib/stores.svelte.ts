import type { UserFull } from '$lib/types'

let user = $state({
  displayName: '',
  email: '',
  photoURL: '',
  phoneNumber: '',
})

let userFull = $state<UserFull>({
  displayName: '',
  email: '',
  photoURL: '',
  phoneNumber: '',
  identificacion: '',
  nombres: '',
  fechanacimiento: '',
  google: '',
  genero: '',
  direccion: '',
})

let isLoggedIn = $state(false)

export function getUser() {
  return user
}

export function setUser(v: typeof user) {
  user = v
}

export function getUserFull() {
  return userFull
}

export function updateUserFull(patch: Partial<UserFull>) {
  Object.assign(userFull, patch)
}

export function getIsLoggedIn() {
  return isLoggedIn
}

export function setIsLoggedIn(v: boolean) {
  isLoggedIn = v
}
