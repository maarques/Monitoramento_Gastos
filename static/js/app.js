document.addEventListener('click', (e) => {
  if (e.target.matches('.btn-edit')) {
    const tr = e.target.closest('tr');
  }
});

document.getElementById('btn-save')?.addEventListener('click', () => {
  const file = new URLSearchParams(location.search).get('file');
  fetch('/api/save', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({file})})
    .then(r => r.json()).then(res => {
      if (res.ok) alert('Salvo com sucesso');
    });
});
