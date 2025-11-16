<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute(); 
const router = useRouter(); 
const authStore = useAuthStore(); 


const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);


const isRegisterMode = computed(() => route.name === 'register');
const formTitle = computed(() => 
    isRegisterMode.value ? 'Neuen Account erstellen' : 'Anmelden bei Sparo'
);
const submitButtonText = computed(() => 
    isRegisterMode.value ? 'Registrieren' : 'Einloggen'
);


const handleSubmit = async () => {
    errorMessage.value = '';
    
    
    if (!email.value || !password.value) {
        errorMessage.value = 'Bitte E-Mail und Passwort eingeben.';
        return;
    }
    
    isLoading.value = true;

    try {
        if (isRegisterMode.value) {
            
            await authStore.register(email.value, password.value);
        } else {
            
            await authStore.login(email.value, password.value);
        }
        
        
        router.push('/dashboard');

    } catch (error) {
        
        errorMessage.value = error;
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div class="auth-container">
        <h1>{{ formTitle }}</h1>
        
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <form @submit.prevent="handleSubmit">
            <div class="form-group">
                <label for="email">E-Mail</label>
                <input type="email" id="email" v-model="email" required :disabled="isLoading">
            </div>
            
            <div class="form-group">
                <label for="password">Passwort</label>
                <input type="password" id="password" v-model="password" required :disabled="isLoading">
            </div>
            
            <button type="submit" :disabled="isLoading">
                {{ isLoading ? 'Verbinde...' : submitButtonText }}
            </button>
        </form>

        <p class="switch-link">
            <router-link v-if="!isRegisterMode" to="/register">Noch keinen Account? Registrieren</router-link>
            <router-link v-else to="/login">Du hast schon einen Account? Anmelden</router-link>
        </p>
    </div>
</template>

<style scoped>
.auth-container {
    max-width: 450px;
    margin: 60px auto;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    background: white;
    text-align: center;
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

h1 {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 30px;
    font-size: 2em;
    font-weight: 700;
}

.form-group {
    margin-bottom: 20px;
    text-align: left;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #2d3748;
    font-size: 0.9em;
}

input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 16px;
    transition: all 0.3s ease;
    background: #f7fafc;
}

input:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

button {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    margin-top: 10px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
}

button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
}

button:active:not(:disabled) {
    transform: translateY(0);
}

button:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
    box-shadow: none;
}

.error-message {
    color: #e53e3e;
    margin-bottom: 20px;
    font-weight: 600;
    padding: 12px;
    background: #fed7d7;
    border-radius: 8px;
    border-left: 4px solid #e53e3e;
}

.switch-link {
    margin-top: 25px;
    font-size: 14px;
    color: #4a5568;
}

.switch-link a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
}

.switch-link a:hover {
    color: #764ba2;
    text-decoration: underline;
}


</style>