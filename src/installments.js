import { closeModal } from './user.js';

export function generateInstallments(numInstallments) {
    const container = document.getElementById('installmentsContainer');
    container.innerHTML = ''; // Clear previous installments

    for (let i = 1; i <= numInstallments; i++) {
        const installmentDiv = document.createElement('div');
        installmentDiv.className = 'installment';

        const header = document.createElement('h2');
        header.textContent = `Installment ${i}`;
        installmentDiv.appendChild(header);

        const dateLabel = document.createElement('label');
        dateLabel.textContent = 'Date:';
        installmentDiv.appendChild(dateLabel);

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.className = 'date-input';
        installmentDiv.appendChild(dateInput);

        const amountLabel = document.createElement('label');
        amountLabel.textContent = ' Amount:';
        installmentDiv.appendChild(amountLabel);

        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.min = '0';
        amountInput.className = 'amount-input';
        installmentDiv.appendChild(amountInput);

        container.appendChild(installmentDiv);
    }

    // Add okay button
    const okayButton = document.createElement('button');
    okayButton.textContent = 'Okay';
    okayButton.type = 'button';
    okayButton.className = 'okay';
    container.appendChild(okayButton);

    // Add event listener to okay button
    okayButton.addEventListener('click', () => {
        closeModal();
    });
}

export function gatherInstallmentData() {
    const rawInstallments = {};
    const installmentDivs = document.getElementsByClassName('installment');

    for (let i = 0; i < installmentDivs.length; i++) {
        const div = installmentDivs[i];
        const dateInput = div.querySelector('.date-input');
        const amountInput = div.querySelector('.amount-input');
        rawInstallments[`installment${i + 1}`] = {
            date: dateInput.value,
            amount: amountInput.value
        };
    }

    return rawInstallments;
}