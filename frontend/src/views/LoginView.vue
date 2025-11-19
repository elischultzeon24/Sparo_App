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
    max-width: 400px;
    margin: 60px auto;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    background: white;
    text-align: center;
    border: 1px solid #e5e5e5;
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
    color: #1a1a1a;
    margin-bottom: 30px;
    font-size: 1.75em;
    font-weight: 600;
}

.form-group {
    margin-bottom: 20px;
    text-align: left;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #4a4a4a;
    font-size: 0.9em;
}

input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #d1d1d1;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.2s ease;
    background: white;
    color: #1a1a1a;
}

input:focus {
    outline: none;
    border-color: #1a1a1a;
}

button {
    width: 100%;
    padding: 14px;
    background: #1a1a1a;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    margin-top: 10px;
    transition: background 0.2s ease;
}

button:hover:not(:disabled) {
    background: #333333;
}

button:disabled {
    background: #d1d1d1;
    cursor: not-allowed;
}

.error-message {
    color: #d32f2f;
    margin-bottom: 20px;
    font-weight: 500;
    padding: 12px;
    background: #ffebee;
    border-radius: 6px;
    border: 1px solid #ffcdd2;
}

.switch-link {
    margin-top: 25px;
    font-size: 14px;
    color: #666666;
}

.switch-link a {
    color: #1a1a1a;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
}

.switch-link a:hover {
    color: #333333;
    text-decoration: underline;
}


</style>