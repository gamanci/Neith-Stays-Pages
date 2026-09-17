const PAYMENTS_API =
    'https://195.20.233.98/api_create_payment.php';

document.addEventListener('DOMContentLoaded', function () {

    const payButton =
        document.getElementById('sumup-pay-button');

    const message =
        document.getElementById('payment-message');

    if (!payButton) {
        console.error('SumUp payment button not found');
        return;
    }

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

            console.log('Payment API response:', data);

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
            payButton.textContent =
                'Pay £5.00 with SumUp';
        }
    });
});
