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
const errorMessage = ref('');
const isLoading = ref(true);

const handleLogout = () => {
    authStore.logout();
    router.push('/login');
};

const fetchSummary = async () => {
    isLoading.value = true;
    errorMessage.value = '';
    
    // Sicherstellen, dass der Token gesetzt ist
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
}
</style>