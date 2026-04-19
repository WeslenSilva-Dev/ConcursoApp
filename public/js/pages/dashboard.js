(function initDashboardPage() {
  const page = document.body;
  if (!page) return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const labelColor = isDark ? '#8888aa' : '#6b7280';

  Chart.defaults.font.family = 'Inter';

  const weekCanvas = document.getElementById('weekChart');
  if (weekCanvas) {
    new Chart(weekCanvas, {
      type: 'bar',
      data: {
        labels: window.dashboardData.chartLabels,
        datasets: [{
          label: 'Horas',
          data: window.dashboardData.chartData,
          backgroundColor: isDark ? 'rgba(108,99,255,0.6)' : 'rgba(17,24,39,0.75)',
          borderColor: isDark ? '#6c63ff' : '#111827',
          borderWidth: 0,
          borderRadius: 5,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: labelColor, font: { size: 11 } }, beginAtZero: true }
        }
      }
    });
  }

  const subjectCanvas = document.getElementById('subjectChart');
  if (subjectCanvas && window.dashboardData.subjectLabels.length > 0) {
    const colors = isDark
      ? ['#6c63ff', '#00cec9', '#fd9644', '#fd79a8', '#a29bfe', '#55efc4']
      : ['#111827', '#374151', '#6b7280', '#9ca3af', '#0d9488', '#d97706'];

    new Chart(subjectCanvas, {
      type: 'doughnut',
      data: {
        labels: window.dashboardData.subjectLabels,
        datasets: [{
          data: window.dashboardData.subjectData,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: labelColor, padding: 12, font: { size: 11 } }
          }
        },
        cutout: '68%'
      }
    });
  }

  document.querySelectorAll('[data-review-toggle]').forEach((button) => {
    button.addEventListener('click', async () => {
      const reviewId = button.getAttribute('data-review-id');
      try {
        const response = await fetch(`/reviews/${reviewId}/complete`, { method: 'PATCH' });
        const data = await response.json();

        if (!data.success) return;

        const item = document.getElementById(`ri-${reviewId}`);
        const check = item?.querySelector('.review-check');
        item?.classList.toggle('review-item--done', data.completed);
        if (check) {
          check.textContent = data.completed ? '✓' : '';
        }
      } catch (error) {
        console.error(error);
      }
    });
  });
})();
