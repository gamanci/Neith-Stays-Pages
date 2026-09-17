const PAYMENTS_API =
    'https://195.20.233.98/api_create_payment.php';

document.addEventListener('DOMContentLoaded', function () {
    const container =
        document.getElementById('sumup-pay-button');

    const message =
        document.getElementById('payment-message');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    const payButton =
        document.createElement('button');

    payButton.type = 'button';
    payButton.textContent = 'Pay £5.00 with SumUp';

    payButton.style.display = 'block';
    payButton.style.width = '100%';
    payButton.style.padding = '15px 20px';
    payButton.style.fontSize = '18px';
    payButton.style.fontWeight = 'bold';
    payButton.style.cursor = 'pointer';
    payButton.style.border = 'none';
    payButton.style.borderRadius = '8px';
    payButton.style.background = '#000000';
    payButton.style.color = '#ffffff';

    payButton.addEventListener('click', async function () {
        payButton.disabled = true;
        payButton.textContent = 'Processing...';

        if (message) {
            message.textContent = '';
        }

        try {
            const response = await fetch(PAYMENTS_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            const data = await response.json();

            if (data.success && data.checkout_url) {
                window.location.href = data.checkout_url;
                return;
            }

            throw new Error(
                data.error || 'Unable to create payment.'
            );

        } catch (error) {
            console.error('Payment error:', error);

            if (message) {
                message.textContent =
                    'Payment could not be started. Please try again.';
            }

            payButton.disabled = false;
            payButton.textContent = 'Pay £5.00 with SumUp';
        }
    });

    container.appendChild(payButton);
});
