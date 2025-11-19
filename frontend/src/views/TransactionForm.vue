<script setup>
import { ref } from 'vue';
import axios from 'axios';

const transaction = ref({
    type: 'Expense', // Standard: Ausgabe
    amount: null,
    category: '',
    date: new Date().toISOString().substring(0, 10), // Heutiges Datum
    description: ''
});
const statusMessage = ref('');
const statusType = ref('');

const categories = ref(['Essen', 'Freizeit', 'Fixkosten', 'Gehalt', 'Sonstiges']);

const submitTransaction = async () => {
    statusMessage.value = '';
    statusType.value = '';

    const apiUrl = `http://localhost:3000/api/transactions/${transaction.value.type.toLowerCase()}`;

    try {
        const payload = { ...transaction.value };
        delete payload.type;

        const response = await axios.post(apiUrl, payload);
        
        statusMessage.value = response.data.message;
        statusType.value = 'success';
        transaction.value.amount = null;
        transaction.value.category = '';

    } catch (error) {
        const msg = error.response?.data?.message || 'Speichern fehlgeschlagen.';
        statusMessage.value = `Fehler: ${msg}`;
        statusType.value = 'error';
        console.error("Transaktionsfehler:", error);
    }
};
</script>

<template>
    <div class="transaction-form card">
        <div class="form-header">
            <h2>💸 Transaktion hinzufügen</h2>
            <router-link to="/dashboard" class="back-link">← Zurück zum Dashboard</router-link>
        </div>
        
        <form @submit.prevent="submitTransaction" class="transaction-form-content">
            <div class="form-group">
                <label>
                    <span class="label-icon">📊</span> Typ:
                </label>
                <select v-model="transaction.type" class="form-input">
                    <option value="Expense">💸 Ausgabe</option>
                    <option value="Income">💰 Einnahme</option>
                </select>
            </div>

            <div class="form-group">
                <label>
                    <span class="label-icon">€</span> Betrag (€):
                </label>
                <input 
                    type="number" 
                    step="0.01" 
                    v-model.number="transaction.amount" 
                    required
                    class="form-input"
                    placeholder="0.00"
                >
            </div>

            <div class="form-group">
                <label>
                    <span class="label-icon">🏷️</span> Kategorie:
                </label>
                <select v-model="transaction.category" required class="form-input">
                    <option value="">Bitte wählen...</option>
                    <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
            </div>

            <div class="form-group">
                <label>
                    <span class="label-icon">📅</span> Datum:
                </label>
                <input 
                    type="date" 
                    v-model="transaction.date" 
                    required
                    class="form-input"
                >
            </div>
            
            <div class="form-group">
                <label>
                    <span class="label-icon">📝</span> Beschreibung (optional):
                </label>
                <input 
                    type="text" 
                    v-model="transaction.description"
                    class="form-input"
                    placeholder="Optional: Beschreibung hinzufügen"
                >
            </div>

            <button type="submit" class="submit-btn">
                ✅ Speichern
            </button>
        </form>

        <div v-if="statusMessage" :class="['status-message', statusType]">
            {{ statusMessage }}
        </div>
    </div>
</template>

<style scoped>
.transaction-form {
    max-width: 600px;
    margin: 0 auto;
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

.form-header {
    margin-bottom: 30px;
    text-align: center;
}

.form-header h2 {
    color: #1a1a1a;
    font-size: 1.75em;
    font-weight: 600;
    margin-bottom: 10px;
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

.transaction-form-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
}

label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-weight: 500;
    color: #4a4a4a;
    font-size: 0.9em;
}

.label-icon {
    font-size: 1.1em;
}

.form-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #d1d1d1;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.2s ease;
    background: white;
    font-family: inherit;
    color: #1a1a1a;
}

.form-input:focus {
    outline: none;
    border-color: #1a1a1a;
}

select.form-input {
    cursor: pointer;
}

.submit-btn {
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

.submit-btn:hover {
    background: #333333;
}

.status-message {
    margin-top: 20px;
    padding: 16px;
    border-radius: 10px;
    font-weight: 600;
    text-align: center;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.status-message.success {
    background: #f1f8f4;
    color: #1a1a1a;
    border: 1px solid #d1d1d1;
    border-left: 3px solid #1a1a1a;
}

.status-message.error {
    background: #ffebee;
    color: #d32f2f;
    border: 1px solid #ffcdd2;
    border-left: 3px solid #d32f2f;
}

/* Responsive Design */
@media (max-width: 768px) {
    .transaction-form {
        padding: 20px;
    }
    
    .form-header h2 {
        font-size: 1.5em;
    }
}
</style>