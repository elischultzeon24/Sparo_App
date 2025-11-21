<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const route = useRoute();
const router = useRouter();
const goalDetails = ref(null);
const isLoading = ref(true);
const showCreateForm = ref(false);
const errorMessage = ref('');
const goalsList = ref([]);
const successMessage = ref('');

const goalForm = ref({
    name: '',
    target_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
});

const amountToAdd = ref('');
const amountToRemove = ref('');
const isUpdating = ref(false);

const goalId = computed(() => route.params.id);

const fetchGoals = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/transactions/goals', {
            headers: {
                'Authorization': `Bearer ${authStore.token}`
            }
        });
        goalsList.value = response.data.goals || [];
        
        if (goalId.value) {
            await fetchGoal(goalId.value);
        } else if (goalsList.value.length > 0) {
            await fetchGoal(goalsList.value[0].goal_id);
            router.replace(`/goals/${goalsList.value[0].goal_id}`);
        } else {
            showCreateForm.value = true;
            isLoading.value = false;
        }
    } catch (error) {
        console.error("Fehler beim Laden der Ziele:", error);
        showCreateForm.value = true;
        isLoading.value = false;
    }
};

const fetchGoal = async (id) => {
    isLoading.value = true;
    showCreateForm.value = false;
    const apiUrl = `http://localhost:3000/api/transactions/goal/${id}`;

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${authStore.token}`
            }
        });
        goalDetails.value = response.data;
        errorMessage.value = '';
        successMessage.value = '';
    } catch (error) {
        console.error("Fehler beim Laden des Ziels:", error);
        if (error.response?.status === 404) {
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

const addAmount = async () => {
    if (!goalId.value) return;
    
    const amount = parseFloat(amountToAdd.value);
    if (!amountToAdd.value || isNaN(amount) || amount <= 0) {
        errorMessage.value = 'Bitte gib einen gültigen Betrag ein.';
        return;
    }

    isUpdating.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    try {
        const response = await axios.put(
            `http://localhost:3000/api/transactions/goal/${goalId.value}/add`,
            { amount: amount },
            {
                headers: {
                    'Authorization': `Bearer ${authStore.token}`
                }
            }
        );

        successMessage.value = response.data.message;
        amountToAdd.value = '';
        
        await fetchGoal(goalId.value);
    } catch (error) {
        console.error("Fehler beim Hinzufügen des Betrags:", error);
        errorMessage.value = error.response?.data?.message || 'Fehler beim Hinzufügen des Betrags.';
    } finally {
        isUpdating.value = false;
    }
};

const removeAmount = async () => {
    if (!goalId.value) return;
    
    const amount = parseFloat(amountToRemove.value);
    if (!amountToRemove.value || isNaN(amount) || amount <= 0) {
        errorMessage.value = 'Bitte gib einen gültigen Betrag ein.';
        return;
    }

    isUpdating.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    try {
        const response = await axios.put(
            `http://localhost:3000/api/transactions/goal/${goalId.value}/remove`,
            { amount: amount },
            {
                headers: {
                    'Authorization': `Bearer ${authStore.token}`
                }
            }
        );

        successMessage.value = response.data.message;
        amountToRemove.value = '';
        
        await fetchGoal(goalId.value);
    } catch (error) {
        console.error("Fehler beim Entfernen des Betrags:", error);
        errorMessage.value = error.response?.data?.message || 'Fehler beim Entfernen des Betrags.';
    } finally {
        isUpdating.value = false;
    }
};

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
        }, {
            headers: {
                'Authorization': `Bearer ${authStore.token}`
            }
        });

        if (response.data.goalId) {
            router.push(`/goals/${response.data.goalId}`);
        } else {
            await fetchGoals();
        }
    } catch (error) {
        console.error("Fehler beim Erstellen des Ziels:", error);
        errorMessage.value = error.response?.data?.message || 'Fehler beim Erstellen des Sparziels.';
    } finally {
        isLoading.value = false;
    }
};

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
            <h1>Sparziel-Fortschritt</h1>
            <router-link to="/dashboard" class="back-link">← Zurück zum Dashboard</router-link>
        </div>
        
        <div v-if="isLoading" class="loading-card card">
            <p>Sparziel wird geladen...</p>
        </div>
        
        <div v-else-if="showCreateForm" class="goal-content">
            <div class="create-goal-card card">
                <h2 class="goal-name">Neues Sparziel erstellen</h2>
                
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
        
        <div v-else-if="goalDetails" class="goal-content">
            <div class="goal-card card">
                <h2 class="goal-name">{{ goalDetails.goal.name }}</h2>
                
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
                        <span class="badge-text">{{ goalDetails.progress.badge }}</span>
                    </div>
                </div>
            </div>

            <div class="amount-controls card">
                <h3>Betrag verwalten</h3>
                
                <div v-if="successMessage" class="success-message">
                    {{ successMessage }}
                </div>
                <div v-if="errorMessage" class="error-message">
                    {{ errorMessage }}
                </div>

                <div class="amount-control-group">
                    <div class="amount-input-group">
                        <label for="add-amount">Betrag hinzufügen (€)</label>
                        <div class="input-with-button">
                            <input 
                                type="number" 
                                id="add-amount" 
                                v-model.number="amountToAdd" 
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                :disabled="isUpdating"
                                class="amount-input"
                            />
                            <button 
                                @click="addAmount" 
                                :disabled="isUpdating || !amountToAdd || parseFloat(amountToAdd) <= 0"
                                class="amount-button add-button"
                            >
                                Hinzufügen
                            </button>
                        </div>
                    </div>

                    <div class="amount-input-group">
                        <label for="remove-amount">Betrag entfernen (€)</label>
                        <div class="input-with-button">
                            <input 
                                type="number" 
                                id="remove-amount" 
                                v-model.number="amountToRemove" 
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                :disabled="isUpdating"
                                class="amount-input"
                            />
                            <button 
                                @click="removeAmount" 
                                :disabled="isUpdating || !amountToRemove || parseFloat(amountToRemove) <= 0"
                                class="amount-button remove-button"
                            >
                                Entfernen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <button @click="showCreateForm = true" class="create-new-button">
                Neues Sparziel erstellen
            </button>
        </div>
        
        <div v-else class="error-card card">
            <p>Sparziel konnte nicht geladen werden.</p>
            <button @click="showCreateForm = true" class="create-new-button">
                Neues Sparziel erstellen
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
    color: #1a1a1a;
    font-size: 2em;
    margin-bottom: 15px;
    font-weight: 600;
}

.back-link {
    color: #1a1a1a;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
}

.back-link:hover {
    color: #333333;
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
    color: #1a1a1a;
    font-size: 1.75em;
    font-weight: 600;
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
    color: #1a1a1a;
    font-size: 1.5em;
}

.separator {
    color: #666666;
    font-weight: 400;
}

.target-amount {
    color: #1a1a1a;
    font-size: 1.5em;
}

.progress-bar-container {
    width: 100%;
    height: 32px;
    background: #e5e5e5;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
}

.progress-bar {
    height: 100%;
    background: #1a1a1a;
    border-radius: 6px;
    transition: width 0.5s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.progress-text {
    color: white;
    font-weight: 600;
    font-size: 0.9em;
    z-index: 1;
}

.badge-card {
    margin-top: 24px;
    background: #fafafa;
    color: #1a1a1a;
    text-align: center;
    border: 1px solid #e5e5e5;
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
    font-weight: 500;
    color: #4a4a4a;
    font-size: 0.9em;
}

.form-group input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #d1d1d1;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.2s ease;
    background: white;
    box-sizing: border-box;
    color: #1a1a1a;
}

.form-group input:focus {
    outline: none;
    border-color: #1a1a1a;
}

.form-group input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
}

.submit-button {
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

.submit-button:hover:not(:disabled) {
    background: #333333;
}

.submit-button:disabled {
    background: #d1d1d1;
    cursor: not-allowed;
}

.create-new-button {
    width: 100%;
    max-width: 600px;
    margin: 30px auto 0;
    padding: 14px;
    background: #1a1a1a;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: background 0.2s ease;
    display: block;
}

.create-new-button:hover {
    background: #333333;
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

.success-message {
    color: #1a1a1a;
    margin-bottom: 20px;
    font-weight: 500;
    padding: 12px;
    background: #f1f8f4;
    border-radius: 6px;
    border: 1px solid #d1d1d1;
}

.amount-controls {
    margin-top: 24px;
}

.amount-controls h3 {
    color: #1a1a1a;
    margin-bottom: 20px;
    font-size: 1.3em;
    font-weight: 600;
}

.amount-control-group {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.amount-input-group {
    display: flex;
    flex-direction: column;
}

.amount-input-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #4a4a4a;
    font-size: 0.9em;
}

.input-with-button {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.amount-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #d1d1d1;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.2s ease;
    background: white;
    color: #1a1a1a;
}

.amount-input:focus {
    outline: none;
    border-color: #1a1a1a;
}

.amount-input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
}

.amount-button {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: background 0.2s ease;
    white-space: nowrap;
}

.add-button {
    background: #1a1a1a;
    color: white;
}

.add-button:hover:not(:disabled) {
    background: #333333;
}

.remove-button {
    background: #d32f2f;
    color: white;
}

.remove-button:hover:not(:disabled) {
    background: #b71c1c;
}

.amount-button:disabled {
    background: #d1d1d1;
    color: #666666;
    cursor: not-allowed;
}

.card {
    background: white;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
    border: 1px solid #e5e5e5;
}

@media (max-width: 768px) {
    .input-with-button {
        flex-direction: column;
    }
    
    .amount-button {
        width: 100%;
    }
}
</style>