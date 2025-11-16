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
            
            <nav>
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
    }
    
    .app-header {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        color: #2d3748;
        padding: 20px 30px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        position: sticky;
        top: 0;
        z-index: 100;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .header-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .logo {
        font-size: 2em;
        font-weight: 800;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-decoration: none;
        letter-spacing: -0.5px;
        transition: transform 0.2s;
    }
    
    .logo:hover {
        transform: scale(1.05);
    }
    
    .logout-btn {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .logout-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
    
    .logout-btn:active {
        transform: translateY(0);
    }
    
    .app-main {
        padding: 40px 20px;
        max-width: 1200px;
        margin: 0 auto;
        min-height: calc(100vh - 80px);
    }
    
    
    .card {
        background: white;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        margin-bottom: 24px;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
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
        
        .logout-btn {
            padding: 8px 15px;
            font-size: 0.9em;
        }
    }
    </style>