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
        if (!file) {
            alert('Nenhum arquivo selecionado');
            return;
        }
        let category = selCat?.value || 'Default';
        if (category === '_new_') {
            const name = newCatInput.value.trim();
            if (!name) {
                alert('Digite o nome da categoria');
                return;
            }
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file, category, row })
        }).then(r => r.json()).then(res => {
            if (res.ok) {
                // Recarrega a página para mostrar a nova categoria em todos os lugares
                window.location.reload();
            } else {
                alert('Erro ao adicionar');
            }
        });
    });

    document.getElementById('gastos-list')?.addEventListener('click', (e) => {
        const btnDel = e.target.closest('.btn-delete');
        const btnEdit = e.target.closest('.btn-edit');
        const btnDelCat = e.target.closest('.btn-delete-category');

        if (btnDelCat) {
            const category = btnDelCat.dataset.category;
            if (!confirm(`Tem certeza que deseja apagar a categoria "${category}" e todos os seus gastos?`)) return;

            fetch('/api/delete_category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file, category })
            }).then(r => r.json()).then(res => {
                if (res.ok) {
                    window.location.reload();
                } else {
                    alert('Erro ao apagar a categoria');
                }
            });
            return;
        }

        if (btnDel) {
            const item = btnDel.closest('.gasto-item');
            const id = item.dataset.id;
            const category = item.closest('.cat-container').dataset.category;
            if (!confirm('Apagar este gasto?')) return;
            fetch('/api/delete_row', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file, category, id })
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file, category, id, field: 'pago', value: checked })
            }).then(r => r.json()).then(res => {
                if (!res.ok) {
                    alert('Erro ao atualizar pago');
                    e.target.checked = !checked;
                }
            });
        }
    });

    function toggleEdit(item) {
        const gastoRow = item.querySelector('.gasto-row');

        if (item.dataset.editing === '1') {
            const id = item.dataset.id;
            const category = item.closest('.cat-container').dataset.category;
            
            const nome = item.querySelector('input[data-field="nome"]').value;
            const valor = item.querySelector('input[data-field="valor"]').value;
            // Converte a data yyyy-mm-dd do input para dd/mm/yyyy para salvar
            const dateParts = item.querySelector('input[data-field="data"]').value.split('-');
            const data = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : '';
            
            const obs = item.querySelector('input[data-field="obs"]').value;
            const newCategory = item.querySelector('select[data-field="category"]').value;

            let updates = [
                {field: 'nome', value: nome},
                {field: 'valor', value: valor},
                {field: 'data', value: data},
                {field: 'obs', value: obs}
            ];

            if (newCategory !== category) {
                updates.push({field: 'category', value: newCategory});
            }

            Promise.all(updates.map(u => fetch('/api/update_row', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file, category, id, field: u.field, value: u.value })
            }).then(r => r.json()))).then(results => {
                const allOk = results.every(r => r.ok);
                if (allOk) {
                    if (newCategory !== category) {
                        window.location.reload();
                    } else {
                        item.querySelector('.nome').textContent = nome;
                        item.querySelector('.valor').textContent = 'R$ ' + (Number(valor).toFixed(2));
                        item.querySelector('.data').textContent = data;
                        item.querySelector('.obs').textContent = obs;
                        item.dataset.editing = '0';
                        item.querySelector('.gasto-edit-category-row').remove();
                    }
                } else {
                    alert('Alguma atualização falhou');
                }
            });
            return;
        }

        const originalCategory = item.closest('.cat-container').dataset.category;

        const nomeCell = item.querySelector('.nome');
        const valorCell = item.querySelector('.valor');
        const dataCell = item.querySelector('.data');
        const obsCell = item.querySelector('.obs');

        const nomeVal = nomeCell.textContent.trim();
        const valorVal = valorCell.textContent.replace(/[R$\s]/g, '').replace(',', '.').trim();
        const dataVal = dataCell.textContent.trim();
        const obsVal = obsCell.textContent.trim();
        
        // Converte a data dd/mm/yyyy do texto para yyyy-mm-dd para o input
        const dateParts = dataVal.split('/');
        const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : '';

        nomeCell.innerHTML = `<input type="text" data-field="nome" value="${nomeVal}">`;
        valorCell.innerHTML = `<input type="number" data-field="valor" value="${valorVal}">`;
        dataCell.innerHTML = `<input type="date" data-field="data" value="${isoDate}">`;
        obsCell.innerHTML = `<input type="text" data-field="obs" value="${obsVal}">`;

        // Cria e adiciona o seletor de categoria
        const allCategories = Array.from(document.querySelectorAll('.cat-container')).map(c => c.dataset.category);
        let categorySelectHTML = `<select data-field="category">`;
        allCategories.forEach(c => {
            categorySelectHTML += `<option value="${c}" ${c === originalCategory ? 'selected' : ''}>${c}</option>`;
        });
        categorySelectHTML += `</select>`;
        
        const categoryRow = document.createElement('div');
        categoryRow.className = 'gasto-edit-category-row';
        categoryRow.innerHTML = `<div class="gasto-col">Mover para:</div><div class="gasto-col">${categorySelectHTML}</div>`;
        
        gastoRow.insertAdjacentElement('afterend', categoryRow);

        item.dataset.editing = '1';
    }

    document.getElementById('btn-save')?.addEventListener('click', () => {
        if (!file) {
            alert('Nenhum arquivo selecionado');
            return;
        }
        const msg = document.getElementById('save-msg');
        msg.textContent = 'Salvando...';
        fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file })
        }).then(r => r.json()).then(res => {
            if (res.ok) {
                msg.textContent = 'Salvo com sucesso.';
                setTimeout(() => msg.textContent = '', 2500);
            } else {
                msg.textContent = 'Erro ao salvar.';
            }
        });
    });
});
