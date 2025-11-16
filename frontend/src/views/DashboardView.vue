<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import axios from 'axios';
//import CategoryChart from './CategoryChart.vue';


const authStore = useAuthStore();
const router = useRouter();


const summaryData = ref({
    currentSaldo: 0,
    totalIncome: 0,
    totalExpense: 0,
    categoryBreakdown: []
});
const errorMessage = ref('');
const isLoading = ref(true);

const handleLogout = () => {
    authStore.logout();
    router.push('/login');
};

const fetchSummary = async () => {
    isLoading.value = true;
    errorMessage.value = '';
    
   
    const today = new Date();
    const month = today.getMonth() + 1; 
    const year = today.getFullYear();

  
    const apiUrl = 'http://localhost:3000/api/transactions/summary';

    try {
        const response = await axios.get(apiUrl, {
            params: { month, year }
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
    return {
        labels: summaryData.value.categoryBreakdown.map(item => item.category),
        data: summaryData.value.categoryBreakdown.map(item => item.category_total)
    };
});

onMounted(() => {
    fetchSummary();
});
</script>

<template>
    <div class="dashboard-container">
        <h1>Willkommen bei Sparo!</h1>
        <p class="welcome-subtitle">Deine persönliche Budget-Übersicht</p>
        
        <h2>Monatliche Finanzübersicht</h2>

        <div v-if="isLoading" class="loading-state card">
            <div class="loading-spinner">⏳</div>
            <p>Daten werden geladen...</p>
        </div>
        <div v-else-if="errorMessage" class="error-state card">
            <div class="error-icon">❌</div>
            <p>{{ errorMessage }}</p>
        </div>
        
        <div v-else>
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

               <router-link to="/add" class="add-transaction-button">
            ➕ Einnahme / Ausgabe hinzufügen
        </router-link>
            <hr>


            <div class="chart-section">
                <h3>Ausgaben nach Kategorie</h3>
                <div v-if="summaryData.categoryBreakdown.length > 0">
                    <CategoryChart :chartData="chartData" />
                </div>
                <p v-else>Noch keine Ausgaben erfasst, um Diagramme zu erstellen.</p>
            </div>
            
            <router-link to="/goals" class="goal-link">Zum Sparziel-Fortschritt wechseln &raquo;</router-link>

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
    color: white;
    font-size: 2.5em;
    margin-bottom: 30px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    font-weight: 800;
}

.dashboard-container h2 {
    color: white;
    margin: 40px 0 20px;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.dashboard-container h3 {
    color: #2d3748;
    margin-bottom: 15px;
    font-weight: 700;
}

.welcome-subtitle {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.2em;
    margin-bottom: 40px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.add-transaction-button {
    display: inline-block;
    padding: 14px 28px;
    margin: 20px 0;
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    color: white;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(72, 187, 120, 0.3);
    font-size: 1em;
}

.add-transaction-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(72, 187, 120, 0.4);
}

.saldo-box {
    margin: 30px auto;
    padding: 40px;
    background: white;
    border-radius: 20px;
    max-width: 500px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.5);
}

.saldo-value {
    font-size: 3.5em;
    font-weight: 800;
    margin: 20px 0;
    letter-spacing: -2px;
}

.positive {
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.negative {
    background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.income-expense-summary {
    margin-top: 30px;
    padding-top: 25px;
    border-top: 2px solid #e2e8f0;
    display: flex;
    justify-content: space-around;
    gap: 20px;
}

.summary-item {
    flex: 1;
    text-align: center;
    padding: 15px;
    border-radius: 12px;
    background: #f7fafc;
    transition: transform 0.2s;
}

.summary-item:hover {
    transform: translateY(-2px);
}

.summary-item.income {
    border: 2px solid #48bb78;
}

.summary-item.expense {
    border: 2px solid #f56565;
}

.summary-label {
    display: block;
    font-size: 0.9em;
    color: #718096;
    margin-bottom: 8px;
    font-weight: 600;
}

.summary-value {
    display: block;
    font-size: 1.4em;
    font-weight: 700;
}

.summary-item.income .summary-value {
    color: #48bb78;
}

.summary-item.expense .summary-value {
    color: #f56565;
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
    color: #e53e3e;
    background: #fed7d7;
    border-left: 4px solid #e53e3e;
}

.error-icon {
    font-size: 3em;
    margin-bottom: 20px;
}

.chart-section {
    background: white;
    border-radius: 20px;
    padding: 30px;
    margin: 30px 0;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.chart-section h3 {
    margin-bottom: 25px;
    color: #2d3748;
}

.goal-link {
    display: inline-block;
    margin-top: 30px;
    padding: 14px 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
}

.goal-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
}

hr {
    border: none;
    border-top: 2px solid rgba(255, 255, 255, 0.3);
    margin: 40px 0;
}

/* Responsive Design */
@media (max-width: 768px) {
    .dashboard-container h1 {
        font-size: 2em;
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
}
</style>