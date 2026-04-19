(function initGoalPage() {
  const form = document.getElementById('goalForm');
  const dailyInput = document.getElementById('dailyHours');
  const weeklyInput = document.getElementById('weeklyHours');
  if (!form || !dailyInput || !weeklyInput) return;

  function setGoal(daily, weekly) {
    dailyInput.value = daily;
    weeklyInput.value = weekly;
  }

  form.addEventListener('submit', (event) => {
    const daily = Number(dailyInput.value);
    const weekly = Number(weeklyInput.value);

    if (!daily || !weekly || daily < 0.5 || weekly < 1) {
      event.preventDefault();
      window.alert('Informe valores validos para as metas.');
      return;
    }

    if (weekly < daily) {
      event.preventDefault();
      window.alert('A meta semanal nao pode ser menor que a meta diaria.');
    }
  });

  window.setGoal = setGoal;
})();
