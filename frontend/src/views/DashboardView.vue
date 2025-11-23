<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import axios from 'axios';
import CategoryChart from './CategoryChart.vue';


const authStore = useAuthStore();
const router = useRouter();


const summaryData = ref({
    currentSaldo: 0,
    totalIncome: 0,
    totalExpense: 0,
    categoryBreakdown: []
});
const goals = ref([]);
const goalsLoading = ref(false);
const errorMessage = ref('');
const isLoading = ref(true);

const handleLogout = () => {
    authStore.logout();
    router.push('/login');
};

const fetchSummary = async () => {
    isLoading.value = true;
    errorMessage.value = '';
    
    if (!authStore.token) {
        errorMessage.value = 'Bitte melde dich an, um die Übersicht zu sehen.';
        isLoading.value = false;
        router.push('/login');
        return;
    }
   
    const today = new Date();
    const month = today.getMonth() + 1; 
    const year = today.getFullYear();

  
    const apiUrl = 'http://localhost:3000/api/transactions/summary';

    try {
        const response = await axios.get(apiUrl, {
            params: { month, year },
            headers: {
                'Authorization': `Bearer ${authStore.token}`
            }
        });
        

        const saldo = response.data.currentSaldo || 0;
        const breakdown = response.data.categoryBreakdown || [];
        

        summaryData.value = {
            currentSaldo: saldo,
            totalIncome: response.data.total_income || 0,
            totalExpense: Math.abs(response.data.total_expense || 0),
            categoryBreakdown: breakdown
        };
        
    } catch (error) {
        
        errorMessage.value = 'Fehler beim Laden der Übersicht. Zugriff verweigert oder Serverfehler.';
        console.error("API Fehler beim Abrufen der Zusammenfassung:", error);
    } finally {
        isLoading.value = false;
    }
};


const chartData = computed(() => {
    // Filtere nur Kategorien mit Beträgen > 0 und konvertiere negative Beträge zu positiven
    const filteredData = summaryData.value.categoryBreakdown
        .filter(item => item.category_total && Math.abs(parseFloat(item.category_total)) > 0)
        .map(item => ({
            category: item.category,
            total: Math.abs(parseFloat(item.category_total))
        }));
    
    return {
        labels: filteredData.map(item => item.category),
        data: filteredData.map(item => item.total)
    };
});

const fetchGoals = async () => {
    goalsLoading.value = true;
    try {
        const response = await axios.get('http://localhost:3000/api/transactions/goals', {
            headers: {
                'Authorization': `Bearer ${authStore.token}`
            }
        });
        goals.value = response.data.goals || [];
    } catch (error) {
        console.error("Fehler beim Laden der Sparziele:", error);
        goals.value = [];
    } finally {
        goalsLoading.value = false;
    }
};

const getGoalProgress = (goal) => {
    const saved = parseFloat(goal.current_savings) || 0;
    const target = parseFloat(goal.target_amount) || 1;
    return Math.min((saved / target) * 100, 100).toFixed(1);
};

onMounted(() => {
    fetchSummary();
    fetchGoals();
});
</script>

<template>
    <div class="dashboard-container">
        <h1>Willkommen bei Sparo!</h1>
        <p class="welcome-subtitle">Deine persönliche Budget-Übersicht</p>
        
        <h2>Monatliche Finanzübersicht</h2>

        <div v-if="isLoading" class="loading-state card">
            <p>Daten werden geladen...</p>
        </div>
        <div v-else-if="errorMessage" class="error-state card">
            <p>{{ errorMessage }}</p>
        </div>
        
        <div v-else>
            <div class="dashboard-grid">
                <div class="saldo-box">
                    <h3>Aktueller Saldo (Monat)</h3>
                    <p :class="{'positive': summaryData.currentSaldo >= 0, 'negative': summaryData.currentSaldo < 0}" class="saldo-value">
                        {{ summaryData.currentSaldo >= 0 ? '+' : '' }}{{ summaryData.currentSaldo.toFixed(2) }} €
                    </p>
                    <div class="income-expense-summary">
                        <div class="summary-item income">
                            <span class="summary-label">Einnahmen</span>
                            <span class="summary-value">{{ summaryData.totalIncome.toFixed(2) }} €</span>
                        </div>
                        <div class="summary-item expense">
                            <span class="summary-label">Ausgaben</span>
                            <span class="summary-value">{{ summaryData.totalExpense.toFixed(2) }} €</span>
                        </div>
                    </div>
                </div>

                <div class="chart-section">
                    <h3>Ausgaben nach Kategorie</h3>
                    <div v-if="summaryData.categoryBreakdown.length > 0">
                        <CategoryChart :chartData="chartData" />
                    </div>
                    <p v-else class="no-data-message">Noch keine Ausgaben erfasst, um Diagramme zu erstellen.</p>
                </div>
            </div>
            
            <div class="action-section">
                <router-link to="/add" class="add-transaction-button">
                    Einnahme / Ausgabe hinzufügen
                </router-link>
            </div>

            <div class="goals-section">
                <div class="goals-header">
                    <h2>Meine Sparziele</h2>
                </div>
                
                <div v-if="goalsLoading" class="loading-state card">
                    <p>Sparziele werden geladen...</p>
                </div>
                <div v-else-if="goals.length === 0" class="no-goals card">
                    <p>Noch keine Sparziele angelegt.</p>
                    <router-link to="/goals" class="create-goal-button">Sparziel erstellen</router-link>
                </div>
                <div v-else class="goals-grid">
                    <div v-for="goal in goals.slice(0, 3)" :key="goal.goal_id" class="goal-card">
                        <div class="goal-header">
                            <h3>{{ goal.name }}</h3>
                            <router-link :to="`/goals/${goal.goal_id}`" class="goal-link">Details →</router-link>
                        </div>
                        <div class="goal-progress">
                            <div class="goal-amounts">
                                <span class="saved">{{ parseFloat(goal.current_savings || 0).toFixed(2) }} €</span>
                                <span class="separator">von</span>
                                <span class="target">{{ parseFloat(goal.target_amount || 0).toFixed(2) }} €</span>
                            </div>
                            <div class="progress-bar-container">
                                <div 
                                    class="progress-bar" 
                                    :style="{ width: getGoalProgress(goal) + '%' }"
                                >
                                    <span class="progress-text">{{ getGoalProgress(goal) }}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            

        </div>
    </div>
</template>

<style scoped>
.dashboard-container {
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

.dashboard-container h1 {
    color: #1a1a1a;
    font-size: 2em;
    margin-bottom: 10px;
    font-weight: 600;
}

.dashboard-container h2 {
    color: #1a1a1a;
    margin: 40px 0 20px;
    font-weight: 600;
    font-size: 1.5em;
}

.dashboard-container h3 {
    color: #1a1a1a;
    margin-bottom: 15px;
    font-weight: 600;
    font-size: 1.2em;
}

.saldo-box h3 {
    text-align: center;
    margin-bottom: 20px;
}

.welcome-subtitle {
    color: #666666;
    font-size: 1em;
    margin-bottom: 40px;
}

.add-transaction-button {
    display: inline-block;
    padding: 12px 24px;
    margin: 20px 0;
    background: #1a1a1a;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    transition: background 0.2s ease;
    font-size: 0.95em;
}

.add-transaction-button:hover {
    background: #333333;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin: 30px 0;
}

.saldo-box {
    padding: 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e5e5;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.saldo-value {
    font-size: 2.5em;
    font-weight: 600;
    margin: 20px 0;
    letter-spacing: -1px;
    text-align: center;
}

.positive {
    color: #1a1a1a;
}

.negative {
    color: #d32f2f;
}

.income-expense-summary {
    margin-top: 30px;
    padding-top: 25px;
    border-top: 1px solid #e5e5e5;
    display: flex;
    justify-content: space-around;
    gap: 20px;
}

.summary-item {
    flex: 1;
    text-align: center;
    padding: 15px;
    border-radius: 6px;
    background: #fafafa;
    border: 1px solid #e5e5e5;
}

.summary-label {
    display: block;
    font-size: 0.85em;
    color: #666666;
    margin-bottom: 8px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.summary-value {
    display: block;
    font-size: 1.3em;
    font-weight: 600;
    color: #1a1a1a;
}

.loading-state, .error-state {
    padding: 60px 40px;
    text-align: center;
    margin: 20px 0;
    font-size: 1.2em;
}

.loading-spinner {
    font-size: 3em;
    margin-bottom: 20px;
    animation: spin 2s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.error-state {
    color: #d32f2f;
    background: #ffebee;
    border: 1px solid #ffcdd2;
    border-radius: 6px;
}

.error-icon {
    font-size: 2em;
    margin-bottom: 15px;
}

.chart-section {
    background: white;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e5e5;
    display: flex;
    flex-direction: column;
}

.chart-section h3 {
    margin-bottom: 25px;
    color: #1a1a1a;
    font-size: 1.2em;
    font-weight: 600;
}

.no-data-message {
    text-align: center;
    color: #666666;
    padding: 20px;
    font-style: italic;
}

.action-section {
    margin-top: 30px;
    text-align: center;
}

.goals-section {
    margin-top: 40px;
}

.goals-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.goals-header h2 {
    margin: 0;
}

.goals-link {
    color: #1a1a1a;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
}

.goals-link:hover {
    color: #333333;
    text-decoration: underline;
}

.goals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.goal-card {
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e5e5;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.goal-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.goal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.goal-header h3 {
    margin: 0;
    font-size: 1.2em;
    font-weight: 600;
    color: #1a1a1a;
}

.goal-link {
    color: #1a1a1a;
    text-decoration: none;
    font-size: 0.9em;
    font-weight: 500;
    transition: color 0.2s ease;
}

.goal-link:hover {
    color: #333333;
    text-decoration: underline;
}

.goal-progress {
    margin-top: 15px;
}

.goal-amounts {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    font-size: 1.1em;
    font-weight: 600;
}

.goal-amounts .saved {
    color: #1a1a1a;
}

.goal-amounts .separator {
    color: #666666;
    font-weight: 400;
}

.goal-amounts .target {
    color: #1a1a1a;
}

.progress-bar-container {
    width: 100%;
    height: 24px;
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
    font-size: 0.85em;
    z-index: 1;
}

.no-goals {
    text-align: center;
    padding: 40px;
}

.no-goals p {
    color: #666666;
    margin-bottom: 20px;
}

.create-goal-button {
    display: inline-block;
    padding: 12px 24px;
    background: #1a1a1a;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    transition: background 0.2s ease;
}

.create-goal-button:hover {
    background: #333333;
}

/* Responsive Design */
@media (max-width: 968px) {
    .dashboard-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }
}

@media (max-width: 768px) {
    .dashboard-container h1 {
        font-size: 2em;
    }
    
    .dashboard-grid {
        margin: 20px 0;
    }
    
    .saldo-box {
        padding: 30px 20px;
    }
    
    .saldo-value {
        font-size: 2.5em;
    }
    
    .income-expense-summary {
        flex-direction: column;
        gap: 15px;
    }
    
    .chart-section {
        padding: 20px;
    }
    
    .add-transaction-button {
        width: 100%;
        text-align: center;
    }
    
    .goals-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
    
    .goals-grid {
        grid-template-columns: 1fr;
    }
}
</style>