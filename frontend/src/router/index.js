import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import GoalTrackerView from '../views/GoalTracker.vue'; 
import TransactionFormView from '../views/TransactionForm.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            redirect: '/dashboard'
        },
        {
            path: '/login',
            name: 'login',
            component: LoginView
        },
        {
            path: '/register',
            name: 'register',
            component: LoginView
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: DashboardView,
            meta: { requiresAuth: true }
        },
        {
            path: '/goals/:id?',
            name: 'goal-tracker',
            component: GoalTrackerView,
            meta: { requiresAuth: true }
        },
        {
            path: '/add',
            name: 'add-transaction',
            component: TransactionFormView,
            meta: { requiresAuth: true }
        },
        {
            path: '/edit/:id',
            name: 'edit-transaction',
            component: TransactionFormView,
            meta: { requiresAuth: true }
        },
        {
            path: '/:catchAll(.*)',
            redirect: '/dashboard'
        }
    ]
});


router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
        next('/login');
    } else if (authStore.isLoggedIn && (to.name === 'login' || to.name === 'register')) {
        next('/dashboard');
    } else {
        next();
    }
});

export default router;