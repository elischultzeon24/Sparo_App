<script setup>
import { RouterView } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();


const handleLogout = () => {
    authStore.logout();
    router.push('/login');
};
</script>

<template>
    <header class="app-header">
        <div class="header-content">
            <RouterLink to="/dashboard" class="logo">Sparo</RouterLink>
            
            <nav class="header-nav">
                <RouterLink 
                    v-if="authStore.isLoggedIn" 
                    to="/goals" 
                    class="nav-link goals-link"
                >
                    Sparziele
                </RouterLink>
                <button v-if="authStore.isLoggedIn" @click="handleLogout" class="logout-btn">
                    Abmelden
                </button>
            </nav>
        </div>
    </header>

    <main class="app-main">
        <RouterView />
    </main>


</template>

    <style>
    
    * {
        box-sizing: border-box;
    }
    
    body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: #f5f5f5;
        min-height: 100vh;
        color: #1a1a1a;
    }
    
    .app-header {
        background: #ffffff;
        color: #1a1a1a;
        padding: 20px 30px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        position: sticky;
        top: 0;
        z-index: 100;
        border-bottom: 1px solid #e5e5e5;
    }
    
    .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .logo {
        font-size: 1.75em;
        font-weight: 600;
        color: #1a1a1a;
        text-decoration: none;
        letter-spacing: -0.5px;
    }
    
    .header-nav {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .nav-link {
        color: #1a1a1a;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9em;
        padding: 10px 16px;
        border-radius: 6px;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    
    .nav-link:hover {
        background: #f5f5f5;
        color: #1a1a1a;
    }
    
    .goals-link {
        border: 1px solid #e5e5e5;
    }
    
    .goals-link:hover {
        background: #fafafa;
        border-color: #d1d1d1;
    }
    
    .goals-link.router-link-active {
        background: #1a1a1a;
        color: white;
        border-color: #1a1a1a;
    }
    
    .goals-link.router-link-active:hover {
        background: #333333;
        border-color: #333333;
    }
    
    .logout-btn {
        background: #1a1a1a;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.9em;
        transition: background 0.2s ease;
    }
    
    .logout-btn:hover {
        background: #333333;
    }
    
    .app-main {
        padding: 40px 20px;
        max-width: 1200px;
        margin: 0 auto;
        min-height: calc(100vh - 80px);
    }
    
    
    .card {
        background: white;
        border-radius: 8px;
        padding: 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        margin-bottom: 24px;
        border: 1px solid #e5e5e5;
    }
    
    
    @media (max-width: 768px) {
        .app-header {
            padding: 15px 20px;
        }
        
        .logo {
            font-size: 1.5em;
        }
        
        .app-main {
            padding: 20px 15px;
        }
        
        .header-nav {
            gap: 10px;
        }
        
        .nav-link {
            padding: 8px 12px;
            font-size: 0.85em;
        }
        
        .logout-btn {
            padding: 8px 15px;
            font-size: 0.9em;
        }
    }
    </style>