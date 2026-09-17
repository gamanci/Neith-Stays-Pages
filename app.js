/**
 * Neith Stays
 * Google Pay + SumUp
 */

const NEITH_PRICE = '5.00';
const NEITH_CURRENCY = 'GBP';

const SUMUP_MERCHANT_CODE = 'M922Z9TB';

/*
 * IMPORTANT:
 * Google gives us this merchant ID after the
 * Google Pay website/domain registration process.
 *
 * Do not invent this value.
 */
const GOOGLE_MERCHANT_ID =
    'REPLACE_WITH_GOOGLE_MERCHANT_ID';

let paymentsClient = null;


/*
 * Google Pay card configuration.
 */
const baseCardPaymentMethod = {

    type: 'CARD',

    parameters: {

        allowedAuthMethods: [
            'PAN_ONLY',
            'CRYPTOGRAM_3DS'
        ],

        allowedCardNetworks: [
            'MASTERCARD',
            'VISA'
        ]
    },

    tokenizationSpecification: {

        type: 'PAYMENT_GATEWAY',

        parameters: {

            gateway: 'sumup',

            gatewayMerchantId:
                SUMUP_MERCHANT_CODE
        }
    }
};


/*
 * Base Google Pay request.
 */
const baseRequest = {

    apiVersion: 2,

    apiVersionMinor: 0,

    merchantInfo: {

        merchantId:
            GOOGLE_MERCHANT_ID,

        merchantName:
            'Neith Stays'
    },

    allowedPaymentMethods: [
        baseCardPaymentMethod
    ]
};


/*
 * Create Google PaymentsClient.
 */
function getGooglePaymentsClient() {

    if (!paymentsClient) {

        paymentsClient =
            new google.payments.api.PaymentsClient({

                environment: 'PRODUCTION'

            });
    }

    return paymentsClient;
}


/*
 * Create the actual payment request.
 */
function getPaymentDataRequest() {

    return {

        ...baseRequest,

        transactionInfo: {

            totalPriceStatus: 'FINAL',

            totalPriceLabel:
                'Neith Stays',

            totalPrice:
                NEITH_PRICE,

            currencyCode:
                NEITH_CURRENCY,

            countryCode:
                'GB'
        }
    };
}


/*
 * Check whether Google Pay is available.
 */
function checkGooglePayReady() {

    if (
        typeof google === 'undefined' ||
        !google.payments ||
        !google.payments.api
    ) {

        showMessage(
            'Google Pay could not be loaded.'
        );

        return;
    }

    const client =
        getGooglePaymentsClient();

    client
        .isReadyToPay({

            apiVersion: 2,

            apiVersionMinor: 0,

            allowedPaymentMethods: [
                baseCardPaymentMethod
            ]

        })

        .then(function(response) {

            if (response.result) {

                addGooglePayButton();

            } else {

                showMessage(
                    'Google Pay is not available on this device or browser.'
                );
            }

        })

        .catch(function(error) {

            console.error(
                'Google Pay readiness error:',
                error
            );

            showMessage(
                'Google Pay is currently unavailable.'
            );
        });
}


/*
 * Add Google's official button.
 */
function addGooglePayButton() {

    const container =
        document.getElementById(
            'google-pay-button'
        );

    if (!container) {

        return;
    }

    container.innerHTML = '';

    const button =
        getGooglePaymentsClient()
            .createButton({

                onClick:
                    onGooglePayButtonClicked

            });

    container.appendChild(button);
}


/*
 * Create our £5 SumUp checkout.
 */
async function createSumUpCheckout() {

    const response =
        await fetch(
            'https://195.20.233.98/api_create_payment.php',
            {

                method: 'POST',

                headers: {

                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify({

                    name:
                        'Neith Stays Customer'

                })
            }
        );

    const data =
        await response.json();

    if (
        !response.ok ||
        !data.success
    ) {

        throw new Error(
            data.error ||
            'Unable to create SumUp checkout'
        );
    }

    return data;
}


/*
 * Customer clicked Google Pay.
 */
async function onGooglePayButtonClicked() {

    try {

        clearMessage();


        /*
         * Step 1:
         * Create £5 checkout on our server.
         */
        const checkout =
            await createSumUpCheckout();


        if (!checkout.checkout_id) {

            throw new Error(
                'SumUp did not return a checkout ID.'
            );
        }


        /*
         * Step 2:
         * Ask Google Pay for payment data.
         */
        const paymentDataRequest =
            getPaymentDataRequest();


        const paymentData =
            await getGooglePaymentsClient()
                .loadPaymentData(
                    paymentDataRequest
                );


        /*
         * Step 3:
         * Send Google's PaymentData to our PHP backend.
         */
        const response =
            await fetch(
                'https://195.20.233.98/api_process_google_pay.php',
                {

                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({

                        checkout_id:
                            checkout.checkout_id,

                        google_pay:
                            paymentData

                    })
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.error ||
                'Google Pay payment failed.'
            );
        }


        /*
         * Payment succeeded.
         */
        if (
            result.status === 'PAID'
        ) {

            window.location.href =
                '/booking-success.html?checkout=' +
                encodeURIComponent(
                    result.checkout_id
                );

            return;
        }


        /*
         * Don't falsely tell the customer
         * that a pending payment succeeded.
         */
        showMessage(
            'Your payment is still being processed. Please wait and check your booking status.'
        );

    } catch (error) {

        console.error(
            'Google Pay error:',
            error
        );


        /*
         * User cancelled Google Pay.
         */
        if (
            error &&
            (
                error.statusCode === 'CANCELED' ||
                error.statusCode === 'CANCELED_BY_USER'
            )
        ) {

            showMessage(
                'Google Pay was cancelled.'
            );

            return;
        }


        showMessage(
            error.message ||
            'Payment failed. Please try again.'
        );
    }
}


/*
 * Display an error/status message.
 */
function showMessage(message) {

    const element =
        document.getElementById(
            'payment-message'
        );

    if (element) {

        element.textContent =
            message;
    }
}


/*
 * Clear status/error message.
 */
function clearMessage() {

    showMessage('');
}


/*
 * Called by Google's script when it loads.
 */
window.onGooglePayLoaded =
    function() {

        checkGooglePayReady();

    };
