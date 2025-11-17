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
    
    // Token wird automatisch von axios.defaults.headers gesetzt

    try {
        const payload = { ...transaction.value };
        delete payload.type; // Typ wird über die URL im Backend gesetzt

        const response = await axios.post(apiUrl, payload);
        
        statusMessage.value = response.data.message;
        statusType.value = 'success';
        // Formular zurücksetzen
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 2em;
    font-weight: 700;
    margin-bottom: 10px;
}

.back-link {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
}

.back-link:hover {
    color: #764ba2;
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
    font-weight: 600;
    color: #2d3748;
    font-size: 0.95em;
}

.label-icon {
    font-size: 1.2em;
}

.form-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 16px;
    transition: all 0.3s ease;
    background: #f7fafc;
    font-family: inherit;
}

.form-input:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

select.form-input {
    cursor: pointer;
}

.submit-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 18px;
    font-weight: 600;
    margin-top: 10px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
}

.submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
}

.submit-btn:active {
    transform: translateY(0);
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
    background: #c6f6d5;
    color: #22543d;
    border-left: 4px solid #48bb78;
}

.status-message.error {
    background: #fed7d7;
    color: #742a2a;
    border-left: 4px solid #e53e3e;
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