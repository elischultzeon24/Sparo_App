<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const goalDetails = ref(null);
const isLoading = ref(true);
const showCreateForm = ref(false);
const errorMessage = ref('');
const goalsList = ref([]);

// Formular-Daten
const goalForm = ref({
    name: '',
    target_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
});

// Prüfe, ob eine ID in der Route ist
const goalId = computed(() => route.params.id);

// Lade alle Ziele
const fetchGoals = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/transactions/goals');
        goalsList.value = response.data.goals || [];
        
        // Wenn eine ID vorhanden ist, lade das spezifische Ziel
        if (goalId.value) {
            await fetchGoal(goalId.value);
        } else if (goalsList.value.length > 0) {
            // Wenn keine ID aber Ziele existieren, lade das erste Ziel
            await fetchGoal(goalsList.value[0].goal_id);
            // Aktualisiere die URL ohne Navigation (replace statt push)
            router.replace(`/goals/${goalsList.value[0].goal_id}`);
        } else {
            // Keine Ziele vorhanden, zeige Formular
            showCreateForm.value = true;
            isLoading.value = false;
        }
    } catch (error) {
        console.error("Fehler beim Laden der Ziele:", error);
        // Bei Fehler zeige Formular
        showCreateForm.value = true;
        isLoading.value = false;
    }
};

// Lade ein spezifisches Ziel
const fetchGoal = async (id) => {
    isLoading.value = true;
    showCreateForm.value = false;
    const apiUrl = `http://localhost:3000/api/transactions/goal/${id}`;

    try {
        const response = await axios.get(apiUrl);
        goalDetails.value = response.data;
        errorMessage.value = '';
    } catch (error) {
        console.error("Fehler beim Laden des Ziels:", error);
        if (error.response?.status === 404) {
            // Ziel nicht gefunden, zeige Formular
            errorMessage.value = 'Sparziel nicht gefunden. Erstelle ein neues Ziel.';
            showCreateForm.value = true;
        } else {
            errorMessage.value = 'Fehler beim Laden des Sparziels.';
        }
        goalDetails.value = null;
    } finally {
        isLoading.value = false;
    }
};

// Erstelle ein neues Ziel
const createGoal = async () => {
    errorMessage.value = '';
    
    if (!goalForm.value.name || !goalForm.value.target_amount || !goalForm.value.end_date) {
        errorMessage.value = 'Bitte fülle alle Felder aus.';
        return;
    }

    isLoading.value = true;

    try {
        const response = await axios.post('http://localhost:3000/api/transactions/goal', {
            name: goalForm.value.name,
            target_amount: parseFloat(goalForm.value.target_amount),
            start_date: goalForm.value.start_date,
            end_date: goalForm.value.end_date
        });

        // Weiterleitung zum erstellten Ziel
        if (response.data.goalId) {
            router.push(`/goals/${response.data.goalId}`);
        } else {
            // Fallback: Lade alle Ziele neu
            await fetchGoals();
        }
    } catch (error) {
        console.error("Fehler beim Erstellen des Ziels:", error);
        errorMessage.value = error.response?.data?.message || 'Fehler beim Erstellen des Sparziels.';
    } finally {
        isLoading.value = false;
    }
};

// Funktion für Gamification-Badge
const getBadgeClass = (badgeName) => {
    if (badgeName) return 'badge-achieved';
    return '';
}

onMounted(() => {
    fetchGoals();
});
</script>

<template>
    <div class="goal-tracker">
        <div class="goal-header">
            <h1>🎯 Sparziel-Fortschritt</h1>
            <router-link to="/dashboard" class="back-link">← Zurück zum Dashboard</router-link>
        </div>
        
        <div v-if="isLoading" class="loading-card card">
            <p>📊 Sparziel wird geladen...</p>
        </div>
        
        <!-- Formular zum Erstellen eines neuen Ziels -->
        <div v-else-if="showCreateForm" class="goal-content">
            <div class="create-goal-card card">
                <h2 class="goal-name">🎯 Neues Sparziel erstellen</h2>
                
                <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
                
                <form @submit.prevent="createGoal" class="goal-form">
                    <div class="form-group">
                        <label for="goal-name">Zielname</label>
                        <input 
                            type="text" 
                            id="goal-name" 
                            v-model="goalForm.name" 
                            placeholder="z.B. Urlaub, Auto, Notfallreserve"
                            required
                            :disabled="isLoading"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="target-amount">Zielbetrag (€)</label>
                        <input 
                            type="number" 
                            id="target-amount" 
                            v-model="goalForm.target_amount" 
                            placeholder="z.B. 5000"
                            min="0"
                            step="0.01"
                            required
                            :disabled="isLoading"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="start-date">Startdatum</label>
                        <input 
                            type="date" 
                            id="start-date" 
                            v-model="goalForm.start_date" 
                            required
                            :disabled="isLoading"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="end-date">Zieldatum</label>
                        <input 
                            type="date" 
                            id="end-date" 
                            v-model="goalForm.end_date" 
                            required
                            :disabled="isLoading"
                        />
                    </div>
                    
                    <button type="submit" :disabled="isLoading" class="submit-button">
                        {{ isLoading ? 'Erstelle...' : 'Sparziel erstellen' }}
                    </button>
                </form>
            </div>
        </div>
        
        <!-- Anzeige eines vorhandenen Ziels -->
        <div v-else-if="goalDetails" class="goal-content">
            <div class="goal-card card">
                <h2 class="goal-name">🎯 {{ goalDetails.goal.name }}</h2>
                
                <div class="progress-section">
                    <div class="progress-info">
                        <span class="saved-amount">
                            {{ parseFloat(goalDetails.goal.current_savings).toFixed(2) }} €
                        </span>
                        <span class="separator">von</span>
                        <span class="target-amount">
                            {{ parseFloat(goalDetails.goal.target_amount).toFixed(2) }} €
                        </span>
                    </div>
                    
                    <div class="progress-bar-container">
                        <div 
                            class="progress-bar" 
                            :style="{ width: Math.min(parseFloat(goalDetails.progress.percent), 100) + '%' }"
                        >
                            <span class="progress-text">{{ goalDetails.progress.percent }}%</span>
                        </div>
                    </div>
                </div>
                
                <div v-if="goalDetails.progress.badge" class="badge-card card">
                    <div class="badge-content">
                        <span class="badge-icon">🎉</span>
                        <span class="badge-text">{{ goalDetails.progress.badge }}</span>
                    </div>
                </div>
            </div>

            <div class="reminder-card card">
                <h3>📅 Monatlicher Spar-Reminder</h3>
                <div class="reminder-content">
                    <p class="reminder-amount">
                        Du musst noch <strong>{{ goalDetails.reminder.amount }} €</strong> pro Monat sparen
                    </p>
                    <p class="reminder-time">
                        um dein Ziel in <strong>{{ goalDetails.reminder.months }} Monaten</strong> zu erreichen
                    </p>
                </div>
            </div>
            
            <button @click="showCreateForm = true" class="create-new-button">
                ➕ Neues Sparziel erstellen
            </button>
        </div>
        
        <!-- Fehleranzeige -->
        <div v-else class="error-card card">
            <p>❌ Sparziel konnte nicht geladen werden.</p>
            <button @click="showCreateForm = true" class="create-new-button">
                ➕ Neues Sparziel erstellen
            </button>
        </div>
    </div>
</template>

<style scoped>
.goal-tracker {
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.goal-header {
    text-align: center;
    margin-bottom: 30px;
}

.goal-header h1 {
    color: white;
    font-size: 2.5em;
    margin-bottom: 15px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    font-weight: 800;
}

.back-link {
    color: white;
    text-decoration: none;
    font-weight: 600;
    opacity: 0.9;
    transition: opacity 0.2s;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.back-link:hover {
    opacity: 1;
    text-decoration: underline;
}

.loading-card, .error-card {
    text-align: center;
    padding: 40px;
    font-size: 1.2em;
}

.goal-content {
    max-width: 800px;
    margin: 0 auto;
}

.goal-card {
    margin-bottom: 24px;
}

.goal-name {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 1.8em;
    font-weight: 700;
    margin-bottom: 30px;
    text-align: center;
}

.progress-section {
    margin: 30px 0;
}

.progress-info {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    font-size: 1.3em;
    font-weight: 600;
}

.saved-amount {
    color: #48bb78;
    font-size: 1.5em;
}

.separator {
    color: #718096;
    font-weight: 400;
}

.target-amount {
    color: #2d3748;
    font-size: 1.5em;
}

.progress-bar-container {
    width: 100%;
    height: 40px;
    background: #e2e8f0;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #48bb78 0%, #38a169 100%);
    border-radius: 20px;
    transition: width 0.5s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 2px 8px rgba(72, 187, 120, 0.3);
}

.progress-text {
    color: white;
    font-weight: 700;
    font-size: 1em;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    z-index: 1;
}

.badge-card {
    margin-top: 24px;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
    text-align: center;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.02);
    }
}

.badge-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 1.3em;
    font-weight: 700;
}

.badge-icon {
    font-size: 1.5em;
}

.reminder-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.reminder-card h3 {
    color: white;
    margin-bottom: 20px;
    font-size: 1.5em;
    font-weight: 700;
}

.reminder-content {
    font-size: 1.1em;
    line-height: 1.8;
}

.reminder-amount {
    margin-bottom: 10px;
    font-size: 1.2em;
}

.reminder-time {
    font-size: 1em;
    opacity: 0.95;
}

.reminder-content strong {
    font-size: 1.2em;
    font-weight: 800;
}

.create-goal-card {
    max-width: 600px;
    margin: 0 auto;
}

.goal-form {
    margin-top: 30px;
}

.form-group {
    margin-bottom: 25px;
    text-align: left;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #2d3748;
    font-size: 0.95em;
}

.form-group input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 16px;
    transition: all 0.3s ease;
    background: #f7fafc;
    box-sizing: border-box;
}

.form-group input:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
    background: #e2e8f0;
    cursor: not-allowed;
}

.submit-button {
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

.submit-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
    box-shadow: none;
}

.create-new-button {
    width: 100%;
    max-width: 600px;
    margin: 30px auto 0;
    padding: 14px;
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(72, 187, 120, 0.3);
    display: block;
}

.create-new-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(72, 187, 120, 0.4);
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

.card {
    background: white;
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    margin-bottom: 24px;
}
</style>