document.addEventListener('DOMContentLoaded', () => {
  const file = window.APP_FILE || null;

  const selCat = document.getElementById('select-category');
  const newCatInput = document.getElementById('new-category-name');
  if (selCat) {
    selCat.addEventListener('change', () => {
      if (selCat.value === '_new_') {
        newCatInput.style.display = 'inline-block';
      } else {
        newCatInput.style.display = 'none';
      }
    });
  }

  const btnAdd = document.getElementById('btn-add');
  btnAdd?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!file) { alert('Nenhum arquivo selecionado'); return; }
    let category = selCat?.value || 'Default';
    if (category === '_new_') {
      const name = newCatInput.value.trim();
      if (!name) { alert('Digite o nome da categoria'); return; }
      category = name;
    }
    const row = {
      nome: document.getElementById('f-nome').value,
      valor: parseFloat(document.getElementById('f-valor').value || 0),
      pago: document.getElementById('f-pago').checked,
      data: document.getElementById('f-data').value,
      obs: document.getElementById('f-obs').value
    };

    fetch('/api/add_row', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({file, category, row})
    }).then(r => r.json()).then(res => {
      if (res.ok) {
        addRowToDOM(category, res.row);
        document.getElementById('f-nome').value = '';
        document.getElementById('f-valor').value = '';
        document.getElementById('f-pago').checked = false;
        document.getElementById('f-data').value = '';
        document.getElementById('f-obs').value = '';
      } else {
        alert('Erro ao adicionar');
      }
    });
  });

  function addRowToDOM(category, row) {
    let catContainer = document.querySelector(`.cat-container[data-category="${category}"]`);
    if (!catContainer) {
      const title = document.createElement('h4');
      title.className = 'cat-title';
      title.textContent = category;
      const container = document.createElement('div');
      container.className = 'cat-container';
      container.dataset.category = category;
      const gastosList = document.getElementById('gastos-list');
      gastosList.appendChild(title);
      gastosList.appendChild(container);
      catContainer = container;
    }

    const item = document.createElement('div');
    item.className = 'gasto-item';
    item.dataset.id = row.id;
    item.innerHTML = `
      <div class="gasto-row">
        <div class="gasto-col nome" data-field="nome">${row.nome}</div>
        <div class="gasto-col valor" data-field="valor">R$ ${Number(row.valor).toFixed(2)}</div>
        <div class="gasto-col pago" data-field="pago"><input type="checkbox" class="chk-pago" ${row.pago ? 'checked' : ''}></div>
        <div class="gasto-col data" data-field="data">${row.data || ''}</div>
        <div class="gasto-col obs" data-field="obs">${row.obs || ''}</div>
        <div class="gasto-col actions">
          <button class="btn-edit">Editar</button>
          <button class="btn-delete">Apagar</button>
        </div>
      </div>
    `;
    catContainer.appendChild(item);
  }

  document.getElementById('gastos-list')?.addEventListener('click', (e) => {
    const btnDel = e.target.closest('.btn-delete');
    const btnEdit = e.target.closest('.btn-edit');
    if (btnDel) {
      const item = btnDel.closest('.gasto-item');
      const id = item.dataset.id;
      const category = item.closest('.cat-container').dataset.category;
      if (!confirm('Apagar este gasto?')) return;
      fetch('/api/delete_row', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({file, category, id})
      }).then(r => r.json()).then(res => {
        if (res.ok) item.remove();
        else alert('Erro ao apagar');
      });
    } else if (btnEdit) {
      const item = btnEdit.closest('.gasto-item');
      toggleEdit(item);
    }
  });

  document.getElementById('gastos-list')?.addEventListener('change', (e) => {
    if (e.target.classList.contains('chk-pago')) {
      const item = e.target.closest('.gasto-item');
      const id = item.dataset.id;
      const category = item.closest('.cat-container').dataset.category;
      const checked = e.target.checked;
      fetch('/api/update_row', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({file, category, id, field: 'pago', value: checked})
      }).then(r => r.json()).then(res => {
        if (!res.ok) {
          alert('Erro ao atualizar pago');
          e.target.checked = !checked;
        }
      });
    }
  });

  function toggleEdit(item) {
    const cols = item.querySelectorAll('.gasto-col');
    if (item.dataset.editing === '1') {
      const id = item.dataset.id;
      const category = item.closest('.cat-container').dataset.category;
      const nome = item.querySelector('input[data-field="nome"]').value;
      const valor = item.querySelector('input[data-field="valor"]').value;
      const data = item.querySelector('input[data-field="data"]').value;
      const obs = item.querySelector('input[data-field="obs"]').value;
      const updates = [
        {field:'nome', value: nome},
        {field:'valor', value: valor},
        {field:'data', value: data},
        {field:'obs', value: obs}
      ];
      Promise.all(updates.map(u => fetch('/api/update_row', {
        method:'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({file, category, id, field: u.field, value: u.value})
      }).then(r=>r.json())))
      .then(results => {
        const allOk = results.every(r => r.ok);
        if (!allOk) alert('Alguma atualização falhou');
        // restore display
        item.querySelector('.nome').textContent = nome;
        item.querySelector('.valor').textContent = 'R$ ' + (Number(valor).toFixed(2));
        item.querySelector('.data').textContent = data;
        item.querySelector('.obs').textContent = obs;
        item.dataset.editing = '0';
      });
      return;
    }

    const nomeCell = item.querySelector('.nome');
    const valorCell = item.querySelector('.valor');
    const dataCell = item.querySelector('.data');
    const obsCell = item.querySelector('.obs');

    const nomeVal = nomeCell.textContent.trim();
    const valorVal = valorCell.textContent.replace(/[R$\s]/g, '').replace(',', '.').trim();
    const dataVal = dataCell.textContent.trim();
    const obsVal = obsCell.textContent.trim();

    nomeCell.innerHTML = `<input data-field="nome" value="${nomeVal}">`;
    valorCell.innerHTML = `<input data-field="valor" value="${valorVal}">`;
    dataCell.innerHTML = `<input data-field="data" value="${dataVal}">`;
    obsCell.innerHTML = `<input data-field="obs" value="${obsVal}">`;

    item.dataset.editing = '1';
  }

  document.getElementById('btn-save')?.addEventListener('click', () => {
    if (!file) { alert('Nenhum arquivo selecionado'); return; }
    const msg = document.getElementById('save-msg');
    msg.textContent = 'Salvando...';
    fetch('/api/save', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({file})
    }).then(r => r.json()).then(res => {
      if (res.ok) {
        msg.textContent = 'Salvo com sucesso.';
        setTimeout(()=> msg.textContent = '', 2500);
      } else {
        msg.textContent = 'Erro ao salvar.';
      }
    });
  });
});
