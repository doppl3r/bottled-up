import Game from '../vue/Game.vue'

/*
  Vue Router is used to change page components using URL paths. This solution 
  reduces the need for multiple v-if conditions in the App.vue file.

  Usage: See Main.js file
*/

export default [
  {
    name: 'home',
    path: '/',
    redirect: '/play'
  },
  {
    name: 'play',
    path: '/play',
    component: Game
  }
];