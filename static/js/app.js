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
        if (selCat.options.length <= 1 || selCat.value === '_new_') {
            selCat.value = '_new_';
            newCatInput.style.display = 'inline-block';
        }
    }

    const btnAdd = document.getElementById('btn-add');
    btnAdd?.addEventListener('click', (e) => {
        e.preventDefault();
        
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
                if (file) {
                    window.location.reload();
                } else {
                    addRowToDOM(category, res.row);
                    
                    document.getElementById('f-nome').value = '';
                    document.getElementById('f-valor').value = '';
                    document.getElementById('f-pago').checked = false;
                    document.getElementById('f-data').value = '';
                    document.getElementById('f-obs').value = '';

                    const optionExists = selCat.querySelector(`option[value="${category}"]`);
                    if (!optionExists) {
                        const newOption = document.createElement('option');
                        newOption.value = category;
                        newOption.textContent = category;
                        const newCatPlaceholder = selCat.querySelector('option[value="_new_"]');
                        selCat.insertBefore(newOption, newCatPlaceholder);
                    }
                    selCat.value = category;
                    newCatInput.style.display = 'none';
                }
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
            title.innerHTML = `${category} <button class="btn-delete-category" data-category="${category}">Excluir Categoria</button>`;
            const container = document.createElement('div');
            container.className = 'cat-container';
            container.dataset.category = category;

            let gastosList = document.getElementById('gastos-list');
            if (!gastosList) {
                const containerSection = document.querySelector('.container');
                const boxSection = document.createElement('section');
                boxSection.className = 'box';
                boxSection.innerHTML = `<h3>Seus Lançamentos</h3><div id="gastos-list" class="gastos-scroll"></div>`;
                containerSection.appendChild(boxSection);
                gastosList = document.getElementById('gastos-list');
            }
            
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
        const btnDelCat = e.target.closest('.btn-delete-category');

        if (btnDelCat) {
            const category = btnDelCat.dataset.category;
            if (!file) {
                const catContainer = document.querySelector(`.cat-container[data-category="${category}"]`);
                const catTitle = catContainer.previousElementSibling;
                if (catContainer) catContainer.remove();
                if (catTitle) catTitle.remove();
                const optionToRemove = selCat.querySelector(`option[value="${category}"]`);
                if(optionToRemove) optionToRemove.remove();
                return;
            }
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
            if (!file) {
                item.remove();
                return;
            }
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
            if (!file) return;
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
            const nome = item.querySelector('input[data-field="nome"]').value;
            const valor = item.querySelector('input[data-field="valor"]').value;
            const dateInput = item.querySelector('input[data-field="data"]').value;
            const obs = item.querySelector('input[data-field="obs"]').value;
            
            const dateParts = dateInput.split('-');
            const displayData = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : '';

            if (!file) {
                item.querySelector('.nome').textContent = nome;
                item.querySelector('.valor').textContent = 'R$ ' + (Number(valor).toFixed(2));
                item.querySelector('.data').textContent = displayData;
                item.querySelector('.obs').textContent = obs;
                item.dataset.editing = '0';
                const categoryRow = item.querySelector('.gasto-edit-category-row');
                if (categoryRow) categoryRow.remove();
                return;
            }

            const id = item.dataset.id;
            const category = item.closest('.cat-container').dataset.category;
            const newCategory = item.querySelector('select[data-field="category"]').value;

            let updates = [
                {field: 'nome', value: nome}, {field: 'valor', value: valor},
                {field: 'data', value: displayData}, {field: 'obs', value: obs}
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
                        item.querySelector('.data').textContent = displayData;
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
        
        const dateParts = dataVal.split('/');
        const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : '';

        nomeCell.innerHTML = `<input type="text" data-field="nome" value="${nomeVal}">`;
        valorCell.innerHTML = `<input type="number" data-field="valor" value="${valorVal}">`;
        dataCell.innerHTML = `<input type="date" data-field="data" value="${isoDate}">`;
        obsCell.innerHTML = `<input type="text" data-field="obs" value="${obsVal}">`;
        
        if (file) {
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
        }

        item.dataset.editing = '1';
    }

    document.getElementById('btn-save')?.addEventListener('click', () => {
        const source_file = window.APP_FILE || null;
        let target_file = source_file;

        if (!source_file) {
            let newFilename = prompt("Por favor, digite o nome para a nova planilha:", "minhas_financas.xlsx");
            
            if (!newFilename || newFilename.trim() === '') {
                alert("O salvamento foi cancelado. É preciso fornecer um nome para o arquivo.");
                return;
            }

            if (!newFilename.toLowerCase().endsWith('.xlsx')) {
                newFilename += '.xlsx';
            }
            target_file = newFilename;
        }

        const msg = document.getElementById('save-msg');
        msg.textContent = 'Salvando...';

        fetch('/api/save', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ source_file, target_file })
        }).then(r => r.json()).then(res => {
            if (res.ok) {
                if (!source_file) {
                    window.location.href = `/dashboard?file=${encodeURIComponent(target_file)}`;
                } else {
                    msg.textContent = 'Salvo com sucesso.';
                    setTimeout(()=> msg.textContent = '', 2500);
                }
            } else {
                msg.textContent = 'Erro ao salvar.';
            }
        });
    });
});
