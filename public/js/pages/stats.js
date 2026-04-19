(function initStatsPage() {
  const weekCanvas = document.getElementById('weekStatsChart');
  const monthlyCanvas = document.getElementById('monthlyStatsChart');
  if (!weekCanvas && !monthlyCanvas) return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const labelColor = isDark ? '#8888aa' : '#6b7280';

  Chart.defaults.font.family = 'Inter';

  if (weekCanvas) {
    new Chart(weekCanvas, {
      type: 'bar',
      data: {
        labels: window.statsData.dailyLabels,
        datasets: [{
          label: 'Horas',
          data: window.statsData.dailyData,
          backgroundColor: isDark ? 'rgba(108,99,255,0.85)' : '#111827',
          borderRadius: 4,
          barPercentage: 0.6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 } } },
          y: { grid: { display: false }, ticks: { color: labelColor, font: { size: 12, weight: '600' } } }
        }
      }
    });
  }

  if (monthlyCanvas) {
    new Chart(monthlyCanvas, {
      type: 'line',
      data: {
        labels: window.statsData.monthlyLabels,
        datasets: [{
          label: 'Horas',
          data: window.statsData.monthlyData,
          borderColor: isDark ? '#00cec9' : '#0d9488',
          backgroundColor: isDark ? 'rgba(0,206,201,0.1)' : 'rgba(13,148,136,0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: isDark ? '#00cec9' : '#0d9488',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: labelColor, font: { size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 } }, beginAtZero: true }
        }
      }
    });
  }
})();
