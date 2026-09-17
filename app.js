const PAYMENTS_API =
    'https://195.20.233.98/api_create_payment.php';

document.addEventListener('DOMContentLoaded', function () {
    const button =
        document.getElementById('google-pay-button');

    const message =
        document.getElementById('payment-message');

    if (!button) {
        return;
    }

    button.innerHTML = '';

    const payButton =
        document.createElement('button');

    payButton.type = 'button';
    payButton.textContent = 'Pay £5.00 with SumUp';

    payButton.addEventListener(
        'click',
        async function () {

            payButton.disabled = true;
            payButton.textContent = 'Processing...';

            if (message) {
                message.textContent = '';
            }

            try {
                const response =
                    await fetch(PAYMENTS_API, {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json'
                        },
                        body: JSON.stringify({})
                    });

                const data =
                    await response.json();

                if (
                    data.success &&
                    data.checkout_url
                ) {
                    window.location.href =
                        data.checkout_url;
                    return;
                }

                throw new Error(
                    data.error ||
                    'Unable to create payment.'
                );

            } catch (error) {

                console.error(
                    'Payment error:',
                    error
                );

                if (message) {
                    message.textContent =
                        'Payment could not be started. Please try again.';
                }

                payButton.disabled = false;
                payButton.textContent =
                    'Pay £5.00 with SumUp';
            }
        }
    );

    button.appendChild(payButton);
});
