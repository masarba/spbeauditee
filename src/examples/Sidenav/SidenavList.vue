<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";

import SidenavItem from "./SidenavItem.vue";


const store = useStore();
const isRTL = computed(() => store.state.isRTL);

const getRoute = () => {
  const route = useRoute();
  const routeArr = route.path.split("/");
  return routeArr[1];
};
</script>
<template>
  <div
    class="collapse navbar-collapse w-auto h-auto h-100"
    id="sidenav-collapse-main"
  >
    <ul class="navbar-nav">


      <li class="nav-item">
        <sidenav-item
          to="/questions"
          :class="getRoute() === 'Daftar pertanyaan' ? 'active' : ''"
          :navText="isRTL ? 'الجداول' : 'Daftar pertanyaan'"
        >
          <template v-slot:icon>
            <i
              class="ni ni-calendar-grid-58 text-warning text-sm opacity-10"
            ></i>
          </template>
        </sidenav-item>
      </li>

      <li class="nav-item">
        <sidenav-item
          to="/panduan-tool"
          :class="getRoute() === 'panduan-tool' ? 'active' : ''"
          :navText="isRTL ? 'الدليل' : 'Panduan Tool'"
        >
          <template v-slot:icon>
            <i
              class="ni ni-book-bookmark text-info text-sm opacity-10"
            ></i>
          </template>
        </sidenav-item>
      </li>
    </ul>
  </div>

  <div class="pt-3 mx-3 mt-3 sidenav-footer">

  </div>
</template>
