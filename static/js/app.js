document.addEventListener('DOMContentLoaded', () => {
    const file = window.APP_FILE || null;
    let isDirty = false;

    // --- LÓGICA DE SALÁRIO E SALDO (NOVO) ---
    const salaryInput = document.getElementById('salary-input');
    const balanceDisplay = document.getElementById('balance-display');
    const fileId = window.APP_FILE || 'default_salary'; 

    // 1. Carregar salário salvo
    const savedSalary = localStorage.getItem('salary_' + fileId);
    if (savedSalary && salaryInput) {
        salaryInput.value = savedSalary;
    }

    // 2. Função para atualizar o saldo
    function updateBalance() {
        const balanceDisplay = document.getElementById('balance-display');
        const creditDisplay = document.getElementById('credit-display'); // <-- Pega o novo card amarelo
        
        if (!salaryInput || !balanceDisplay || !creditDisplay) return;

        // Pega o salário (se vazio, assume 0)
        const salary = parseFloat(salaryInput.value) || 0;
        
        // Salva
        localStorage.setItem('salary_' + fileId, salary);

        // Zera os contadores separados
        let totalDebito = 0;
        let totalCredito = 0;

        // Percorre CADA LINHA de gasto, e não apenas o valor
        document.querySelectorAll('.gasto-item').forEach(item => {
            const valorEl = item.querySelector('.gasto-col.valor');
            const formaEl = item.querySelector('.gasto-col.payment'); // <-- Pega a coluna da forma de pagamento
            
            if (valorEl) {
                const valorTexto = valorEl.textContent.replace('R$', '').trim();
                const valor = parseFloat(valorTexto);
                
                if (!isNaN(valor)) {
                    // Se a coluna de pagamento existir, pega o texto. Se não, assume Débito.
                    const forma = formaEl ? formaEl.textContent.trim() : 'Débito';
                    
                    // Separa a soma dependendo do texto!
                    if (forma === 'Crédito') {
                        totalCredito += valor;
                    } else {
                        totalDebito += valor;
                    }
                }
            }
        });

        // 1. Calcula o Saldo (Salário menos apenas Débito/Pix/Dinheiro)
        const restante = salary - totalDebito;
        if (restante >= 0) {
            balanceDisplay.style.color = "#005A3A"; // Verde
        } else {
            balanceDisplay.style.color = "#dc3545"; // Vermelho
        }
        balanceDisplay.textContent = 'R$ ' + restante.toFixed(2);

        // 2. Mostra o valor da Fatura (Apenas Crédito)
        creditDisplay.textContent = 'R$ ' + totalCredito.toFixed(2);
    }

    if (salaryInput) {
        salaryInput.addEventListener('input', updateBalance);
    }
    // Executa inicial
    updateBalance();
    // ----------------------------------------

    window.addEventListener('beforeunload', (event) => {
        if (isDirty) {
            event.preventDefault();
            event.returnValue = '';
        }
    });

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
        
        const dateValue = document.getElementById('f-data').value;
        let formattedDate = dateValue;
        if (dateValue) {
            const dateParts = dateValue.split('-');
            if (dateParts.length === 3) {
                formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            }
        }
        
        const row = {
            nome: document.getElementById('f-nome').value,
            valor: parseFloat(document.getElementById('f-valor').value || 0),
            pago: document.getElementById('f-pago').checked,
            data: formattedDate,
            forma_pagamento: document.getElementById('f-forma_pagamento').value,
            obs: document.getElementById('f-obs').value
        };

        fetch('/api/add_row', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file, category, row })
        }).then(r => r.json()).then(res => {
            if (res.ok) {
                isDirty = true;
                addRowToDOM(category, res.row);
                updateBalance(); // Atualiza o saldo ao adicionar

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
            } else {
                alert('Erro ao adicionar');
            }
        });
    });

    function addRowToDOM(category, row) {
        const msgEmpty = document.getElementById('msg-empty');
        if (msgEmpty) {
            msgEmpty.remove();
        }
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
                const lastBox = Array.from(document.querySelectorAll('.box')).pop();
                const containerSection = lastBox.parentNode;
                const boxSection = document.createElement('section');
                boxSection.className = 'box';
                boxSection.innerHTML = `<h3>Seus Lançamentos</h3><div id="gastos-list" class="gastos-scroll"></div>`;
                lastBox.insertAdjacentElement('afterend', boxSection);
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
            <div class="gasto-col payment" data-field="forma_pagamento">${row.forma_pagamento || 'Débito'}</div> <div class="gasto-col obs" data-field="obs">${row.obs || ''}</div>
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
            if (!confirm(`Tem certeza que deseja apagar a categoria "${category}" e todos os seus gastos?`)) return;

            isDirty = true;
            if (!file) {
                const catContainer = document.querySelector(`.cat-container[data-category="${category}"]`);
                const catTitle = catContainer.previousElementSibling;
                if (catContainer) catContainer.remove();
                if (catTitle) catTitle.remove();
                const optionToRemove = selCat.querySelector(`option[value="${category}"]`);
                if(optionToRemove) optionToRemove.remove();
                setTimeout(updateBalance, 50); // Atualiza saldo após apagar categoria local
                return;
            }

            fetch('/api/delete_category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file, category })
            }).then(r => r.json()).then(res => {
                if (res.ok) {
                    const catContainer = document.querySelector(`.cat-container[data-category="${category}"]`);
                    const catTitle = catContainer.previousElementSibling;
                    if (catContainer) catContainer.remove();
                    if (catTitle) catTitle.remove();
                    setTimeout(updateBalance, 50); // Atualiza saldo após apagar categoria
                } else {
                    alert('Erro ao apagar a categoria');
                    isDirty = false;
                }
            });
            return;
        }

        if (btnDel) {
            if (!confirm('Apagar este gasto?')) return;
            isDirty = true;
            const item = btnDel.closest('.gasto-item');
            const id = item.dataset.id;
            if (!file) {
                item.remove();
                setTimeout(updateBalance, 50); // Atualiza saldo após apagar local
                return;
            }
            const category = item.closest('.cat-container').dataset.category;
            fetch('/api/delete_row', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file, category, id })
            }).then(r => r.json()).then(res => {
                if (res.ok) {
                    item.remove();
                    setTimeout(updateBalance, 50); // Atualiza saldo após apagar
                } else {
                    alert('Erro ao apagar');
                    isDirty = false;
                }
            });
        } else if (btnEdit) {
            const item = btnEdit.closest('.gasto-item');
            toggleEdit(item);
        }
    });

    document.getElementById('gastos-list')?.addEventListener('change', (e) => {
        if (e.target.classList.contains('chk-pago')) {
            isDirty = true;
            const item = e.target.closest('.gasto-item');
            
            if (!file) {
                return;
            }

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
                    isDirty = false;
                }
            });
        }
    });

    function toggleEdit(item) {
        const gastoRow = item.querySelector('.gasto-row');

        // ==== MODO: SALVAR A EDIÇÃO ====
        if (item.dataset.editing === '1') {
            isDirty = true;
            const nome = item.querySelector('input[data-field="nome"]').value;
            const valor = item.querySelector('input[data-field="valor"]').value;
            const dateInput = item.querySelector('input[data-field="data"]').value;
            const obs = item.querySelector('input[data-field="obs"]').value;
            const forma = item.querySelector('select[data-field="forma_pagamento"]').value; // <-- Lê a nova forma
            
            const dateParts = dateInput.split('-');
            const displayData = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : '';
            
            const newCategorySelect = item.querySelector('select[data-field="category"]');
            const newCategory = newCategorySelect ? newCategorySelect.value : item.closest('.cat-container').dataset.category;

            // Se for uma planilha nova (não salva)
            if (!file) {
                if (newCategory && newCategory !== item.closest('.cat-container').dataset.category) {
                    const targetContainer = document.querySelector(`.cat-container[data-category="${newCategory}"]`);
                    targetContainer.appendChild(item);
                }
                item.querySelector('.nome').textContent = nome;
                item.querySelector('.valor').textContent = 'R$ ' + (Number(valor).toFixed(2));
                item.querySelector('.data').textContent = displayData;
                item.querySelector('.payment').textContent = forma; // <-- Atualiza a tela
                item.querySelector('.obs').textContent = obs;
                item.dataset.editing = '0';
                const categoryRow = item.querySelector('.gasto-edit-category-row');
                if (categoryRow) categoryRow.remove();
                
                updateBalance();
                return;
            }

            // Se for planilha existente, manda pro backend
            const id = item.dataset.id;
            const category = item.closest('.cat-container').dataset.category;
            
            let updates = [
                {field: 'nome', value: nome}, 
                {field: 'valor', value: valor},
                {field: 'data', value: displayData}, 
                {field: 'forma_pagamento', value: forma}, // <-- Manda salvar a nova forma
                {field: 'obs', value: obs}
            ];

            if (newCategory && newCategory !== category) {
                updates.push({field: 'category', value: newCategory});
            }

            Promise.all(updates.map(u => fetch('/api/update_row', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file, category, id, field: u.field, value: u.value })
            }).then(r => r.json()))).then(results => {
                const allOk = results.every(r => r.ok);
                if (allOk) {
                    if (newCategory && newCategory !== category) {
                        const targetContainer = document.querySelector(`.cat-container[data-category="${newCategory}"]`);
                        targetContainer.appendChild(item);
                    }
                    item.querySelector('.nome').textContent = nome;
                    item.querySelector('.valor').textContent = 'R$ ' + (Number(valor).toFixed(2));
                    item.querySelector('.data').textContent = displayData;
                    item.querySelector('.payment').textContent = forma; // <-- Atualiza a tela
                    item.querySelector('.obs').textContent = obs;
                    item.dataset.editing = '0';
                    item.querySelector('.gasto-edit-category-row').remove();
                    
                    updateBalance(); 
                } else {
                    alert('Alguma atualização falhou');
                    isDirty = false;
                }
            });
            return;
        }

        // ==== MODO: ENTRAR EM EDIÇÃO ====
        const originalCategory = item.closest('.cat-container').dataset.category;
        const nomeCell = item.querySelector('.nome');
        const valorCell = item.querySelector('.valor');
        const dataCell = item.querySelector('.data');
        const formaCell = item.querySelector('.payment'); // <-- Pega a célula do pagamento
        const obsCell = item.querySelector('.obs');
        
        const nomeVal = nomeCell.textContent.trim();
        const valorVal = valorCell.textContent.replace(/[R$\s]/g, '').replace(',', '.').trim();
        const dataVal = dataCell.textContent.trim();
        const formaVal = formaCell ? formaCell.textContent.trim() : 'Débito'; // <-- Pega o valor atual
        const obsVal = obsCell.textContent.trim();
        
        const dateParts = dataVal.split('/');
        const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : '';

        // Transforma tudo em campos de input
        nomeCell.innerHTML = `<input type="text" data-field="nome" value="${nomeVal}">`;
        valorCell.innerHTML = `<input type="number" data-field="valor" value="${valorVal}">`;
        dataCell.innerHTML = `<input type="date" data-field="data" value="${isoDate}">`;
        obsCell.innerHTML = `<input type="text" data-field="obs" value="${obsVal}">`;
        
        // Transforma a forma de pagamento em um dropdown (select) selecionando o atual
        formaCell.innerHTML = `
            <select data-field="forma_pagamento">
                <option value="Débito" ${formaVal === 'Débito' ? 'selected' : ''}>Débito</option>
                <option value="Crédito" ${formaVal === 'Crédito' ? 'selected' : ''}>Crédito</option>
                <option value="Pix" ${formaVal === 'Pix' ? 'selected' : ''}>Pix</option>
                <option value="Dinheiro" ${formaVal === 'Dinheiro' ? 'selected' : ''}>Dinheiro</option>
            </select>
        `;
        
        const allCategories = Array.from(document.querySelectorAll('.cat-container')).map(c => c.dataset.category);
        if (allCategories.length > 0) {
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
        const saveButton = document.getElementById('btn-save');
        const msg = document.getElementById('save-msg');
        const source_file = window.APP_FILE || null;
        let target_file = source_file;

        const date = new Date();
        const monthNames = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const defaultFilename = `gastos_${month}_${year}.xlsx`;

        let newFilename = prompt("Por favor, digite o nome para salvar a planilha:", defaultFilename);
        
        if (!newFilename || newFilename.trim() === '') {
            alert("O salvamento foi cancelado. É preciso fornecer um nome para o arquivo.");
            return;
        }

        if (!newFilename.toLowerCase().endsWith('.xlsx')) {
            newFilename += '.xlsx';
        }
        target_file = newFilename;

        saveButton.disabled = true;
        msg.textContent = 'Salvando planilha...';
        msg.className = 'saving';

        fetch('/api/save', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ source_file, target_file })
        }).then(r => r.json()).then(res => {
            if (res.ok) {
                isDirty = false;
                msg.textContent = 'Planilha salva com sucesso!';
                msg.className = 'success';

                setTimeout(() => {
                    window.location.href = `/dashboard?file=${encodeURIComponent(target_file)}`;
                }, 1500);
                
            } else {
                msg.textContent = 'Erro ao salvar a planilha.';
                msg.className = 'error';
                setTimeout(() => {
                    saveButton.disabled = false;
                    msg.textContent = '';
                    msg.className = '';
                }, 3000);
            }
        }).catch(() => {
            msg.textContent = 'Erro de conexão ao salvar.';
            msg.className = 'error';
            setTimeout(() => {
                saveButton.disabled = false;
                msg.textContent = '';
                msg.className = '';
            }, 3000);
        });
    });
});
