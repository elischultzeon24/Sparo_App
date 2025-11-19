<script setup>
import { computed,ref } from 'vue';
import { PieChart } from 'vue-chart-3';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({
    chartData: {
        type: Object,
        required: true
    }
});

const chartOptions = computed(() => ({
    labels: props.chartData.labels,
    datasets: [
        {
            data: props.chartData.data,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        }
    ]
}));

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