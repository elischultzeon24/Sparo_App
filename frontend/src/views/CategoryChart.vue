<script setup>
import { computed,ref } from 'vue';
import { PieChart } from 'vue-chart-3';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables); // Chart.js Komponenten registrieren

// Definiere die Props, die die Dashboard-Daten enthalten
const props = defineProps({
    // chartData erwartet ein Objekt mit Labels und Daten-Arrays (siehe Dashboard.vue)
    chartData: {
        type: Object,
        required: true
    }
});

// Konfiguriere die Daten für Chart.js
const chartOptions = computed(() => ({
    labels: props.chartData.labels,
    datasets: [
        {
            data: props.chartData.data,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        }
    ]
}));

// Optionen für das Diagramm (z.B. Responsivität)
const options = ref({
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: false,
        }
    }
});

</script>

<template>
    <div class="chart-container">
        <PieChart :chartData="chartOptions" :options="options" /> 
    </div>
</template>

<style scoped>
.chart-container {
    max-width: 500px;
    margin: 20px auto;
    padding: 20px;
    background: #f7fafc;
    border-radius: 12px;
}

/* Verbesserte Chart-Optionen */
:deep(.chartjs-render-monitor) {
    animation: fadeIn 0.5s ease-in;
}
</style>